import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { Workflow, WorkflowExecution } from '@flowforge/core-entities';
import {
  ExecuteWorkflowDto,
  WorkflowExecutionStatus,
  WorkflowExecutionMode,
} from '@flowforge/core-types';

@Injectable()
export class WorkflowExecutionService {
  private readonly logger = new Logger(WorkflowExecutionService.name);

  constructor(
    @InjectRepository(Workflow)
    private readonly workflowRepository: Repository<Workflow>,
    @InjectRepository(WorkflowExecution)
    private readonly executionRepository: Repository<WorkflowExecution>,
    @InjectQueue('workflow-execution')
    private readonly executionQueue: Queue,
  ) {}

  /**
   * Execute a workflow manually
   */
  async executeWorkflow(dto: ExecuteWorkflowDto, userId: string): Promise<WorkflowExecution> {
    this.logger.log(`Starting manual execution of workflow ${dto.workflowId} by user ${userId}`);

    const workflow = await this.workflowRepository.findOne({
      where: { id: dto.workflowId },
      relations: ['organization'],
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${dto.workflowId} not found`);
    }

    if (!workflow.isActive) {
      throw new BadRequestException('Cannot execute inactive workflow');
    }

    // Create execution record
    const execution = this.executionRepository.create({
      workflow,
      status: WorkflowExecutionStatus.RUNNING,
      mode: WorkflowExecutionMode.MANUAL,
      startTime: new Date(),
      executionData: {
        inputData: dto.inputData || {},
        nodes: workflow.nodes,
        connections: workflow.connections,
        settings: workflow.settings,
      },
    });

    const savedExecution = await this.executionRepository.save(execution);

    // Add to execution queue
    await this.executionQueue.add('execute-workflow', {
      executionId: savedExecution.id,
      workflowId: workflow.id,
      userId,
      mode: WorkflowExecutionMode.MANUAL,
      inputData: dto.inputData || {},
    }, {
      priority: 1,
      delay: 0,
    });

    this.logger.log(`Queued execution ${savedExecution.id} for processing`);
    return savedExecution;
  }

  /**
   * Execute workflow via webhook trigger
   */
  async executeWorkflowViaWebhook(
    workflowId: string,
    nodeId: string,
    webhookData: any,
  ): Promise<WorkflowExecution> {
    this.logger.log(`Starting webhook execution of workflow ${workflowId} via node ${nodeId}`);

    const workflow = await this.workflowRepository.findOne({
      where: { id: workflowId },
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${workflowId} not found`);
    }

    if (!workflow.isActive) {
      throw new BadRequestException('Cannot execute inactive workflow');
    }

    const execution = this.executionRepository.create({
      workflow,
      status: WorkflowExecutionStatus.RUNNING,
      mode: WorkflowExecutionMode.WEBHOOK,
      startTime: new Date(),
      executionData: {
        inputData: webhookData,
        triggerNode: nodeId,
        nodes: workflow.nodes,
        connections: workflow.connections,
        settings: workflow.settings,
      },
    });

    const savedExecution = await this.executionRepository.save(execution);

    await this.executionQueue.add('execute-workflow', {
      executionId: savedExecution.id,
      workflowId: workflow.id,
      mode: WorkflowExecutionMode.WEBHOOK,
      inputData: webhookData,
      triggerNode: nodeId,
    }, {
      priority: 2,
      delay: 0,
    });

    return savedExecution;
  }

  /**
   * Execute workflow via schedule
   */
  async executeWorkflowViaSchedule(workflowId: string): Promise<WorkflowExecution> {
    this.logger.log(`Starting scheduled execution of workflow ${workflowId}`);

    const workflow = await this.workflowRepository.findOne({
      where: { id: workflowId },
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${workflowId} not found`);
    }

    if (!workflow.isActive) {
      this.logger.warn(`Skipping execution of inactive workflow ${workflowId}`);
      return null;
    }

    const execution = this.executionRepository.create({
      workflow,
      status: WorkflowExecutionStatus.RUNNING,
      mode: WorkflowExecutionMode.SCHEDULE,
      startTime: new Date(),
      executionData: {
        inputData: {},
        nodes: workflow.nodes,
        connections: workflow.connections,
        settings: workflow.settings,
      },
    });

    const savedExecution = await this.executionRepository.save(execution);

    await this.executionQueue.add('execute-workflow', {
      executionId: savedExecution.id,
      workflowId: workflow.id,
      mode: WorkflowExecutionMode.SCHEDULE,
      inputData: {},
    }, {
      priority: 3,
      delay: 0,
    });

    return savedExecution;
  }

  /**
   * Get execution by ID
   */
  async getExecution(executionId: string): Promise<WorkflowExecution> {
    const execution = await this.executionRepository.findOne({
      where: { id: executionId },
      relations: ['workflow'],
    });

    if (!execution) {
      throw new NotFoundException(`Execution with ID ${executionId} not found`);
    }

    return execution;
  }

  /**
   * Get executions for a workflow
   */
  async getWorkflowExecutions(
    workflowId: string,
    page = 1,
    limit = 20,
  ): Promise<{ executions: WorkflowExecution[]; total: number }> {
    const [executions, total] = await this.executionRepository.findAndCount({
      where: { workflow: { id: workflowId } },
      relations: ['workflow'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { executions, total };
  }

  /**
   * Cancel running execution
   */
  async cancelExecution(executionId: string): Promise<WorkflowExecution> {
    const execution = await this.getExecution(executionId);

    if (execution.status !== WorkflowExecutionStatus.RUNNING) {
      throw new BadRequestException('Can only cancel running executions');
    }

    execution.status = WorkflowExecutionStatus.CANCELLED;
    execution.endTime = new Date();

    await this.executionRepository.save(execution);

    // Remove from queue if still pending
    const jobs = await this.executionQueue.getJobs(['waiting', 'active', 'delayed']);
    const job = jobs.find(j => j.data.executionId === executionId);
    if (job) {
      await job.remove();
    }

    this.logger.log(`Cancelled execution ${executionId}`);
    return execution;
  }

  /**
   * Update execution status
   */
  async updateExecutionStatus(
    executionId: string,
    status: WorkflowExecutionStatus,
    errorMessage?: string,
  ): Promise<WorkflowExecution> {
    const execution = await this.getExecution(executionId);
    
    execution.status = status;
    if (status !== WorkflowExecutionStatus.RUNNING) {
      execution.endTime = new Date();
    }
    if (errorMessage) {
      execution.errorMessage = errorMessage;
    }

    return await this.executionRepository.save(execution);
  }

  /**
   * Get execution statistics
   */
  async getExecutionStats(workflowId?: string) {
    const whereCondition = workflowId ? { workflow: { id: workflowId } } : {};
    
    const total = await this.executionRepository.count({ where: whereCondition });
    const running = await this.executionRepository.count({
      where: { ...whereCondition, status: WorkflowExecutionStatus.RUNNING },
    });
    const successful = await this.executionRepository.count({
      where: { ...whereCondition, status: WorkflowExecutionStatus.SUCCESS },
    });
    const failed = await this.executionRepository.count({
      where: { ...whereCondition, status: WorkflowExecutionStatus.ERROR },
    });

    return {
      total,
      running,
      successful,
      failed,
      successRate: total > 0 ? (successful / total) * 100 : 0,
    };
  }
}
