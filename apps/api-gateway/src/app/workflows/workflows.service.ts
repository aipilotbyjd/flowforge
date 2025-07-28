import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { CreateWorkflowDto, UpdateWorkflowDto, ExecuteWorkflowDto } from '@flowforge/core-types';

export interface WorkflowNode {
  id: string;
  name: string;
  type: string;
  position: [number, number];
  parameters: Record<string, any>;
  credentials?: Record<string, any>;
}

export interface WorkflowConnection {
  sourceNodeId: string;
  targetNodeId: string;
  sourceOutput: string;
  targetInput: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  settings: {
    executionOrder: 'v0' | 'v1';
    saveManualExecutions: boolean;
    saveDataErrorExecution: 'all' | 'none';
    saveDataSuccessExecution: 'all' | 'none';
    executionTimeout: number;
    timezone: string;
  };
  active: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  versionId: number;
}

@Injectable()
export class WorkflowsService {
  private readonly logger = new Logger(WorkflowsService.name);
  private readonly workflows = new Map<string, Workflow>(); // In-memory storage for demo

  constructor(@InjectQueue('workflow-execution') private readonly workflowQueue: Queue) {}

  async create(createWorkflowDto: CreateWorkflowDto): Promise<Workflow> {
    this.logger.debug('Creating new workflow', createWorkflowDto);
    
    const workflow: Workflow = {
      id: this.generateId(),
      name: createWorkflowDto.name,
      description: createWorkflowDto.description,
      nodes: createWorkflowDto.nodes || [],
      connections: createWorkflowDto.connections || [],
      settings: {
        executionOrder: 'v1',
        saveManualExecutions: true,
        saveDataErrorExecution: 'all',
        saveDataSuccessExecution: 'all',
        executionTimeout: 3600,
        timezone: 'UTC',
        ...createWorkflowDto.settings,
      },
      active: false,
      tags: createWorkflowDto.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      versionId: 1,
    };

    this.workflows.set(workflow.id, workflow);
    this.logger.log(`Workflow created: ${workflow.id}`);
    
    return workflow;
  }

  async findAll(page = 1, limit = 50, tags?: string[]): Promise<{ workflows: Workflow[]; total: number }> {
    let workflows = Array.from(this.workflows.values());
    
    if (tags && tags.length > 0) {
      workflows = workflows.filter(workflow => 
        workflow.tags.some(tag => tags.includes(tag))
      );
    }

    const total = workflows.length;
    const startIndex = (page - 1) * limit;
    const paginatedWorkflows = workflows.slice(startIndex, startIndex + limit);

    return {
      workflows: paginatedWorkflows,
      total,
    };
  }

  async findOne(id: string): Promise<Workflow> {
    const workflow = this.workflows.get(id);
    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }
    return workflow;
  }

  async update(id: string, updateWorkflowDto: UpdateWorkflowDto): Promise<Workflow> {
    const workflow = await this.findOne(id);
    
    Object.assign(workflow, {
      ...updateWorkflowDto,
      updatedAt: new Date(),
      versionId: workflow.versionId + 1,
    });

    this.workflows.set(id, workflow);
    this.logger.log(`Workflow updated: ${id}`);
    
    return workflow;
  }

  async remove(id: string): Promise<void> {
    const workflow = await this.findOne(id);
    
    if (workflow.active) {
      throw new BadRequestException('Cannot delete an active workflow. Deactivate it first.');
    }

    this.workflows.delete(id);
    this.logger.log(`Workflow deleted: ${id}`);
  }

  async activate(id: string): Promise<Workflow> {
    const workflow = await this.findOne(id);
    
    // Validate workflow before activation
    this.validateWorkflow(workflow);
    
    workflow.active = true;
    workflow.updatedAt = new Date();
    
    this.workflows.set(id, workflow);
    this.logger.log(`Workflow activated: ${id}`);
    
    return workflow;
  }

  async deactivate(id: string): Promise<Workflow> {
    const workflow = await this.findOne(id);
    
    workflow.active = false;
    workflow.updatedAt = new Date();
    
    this.workflows.set(id, workflow);
    this.logger.log(`Workflow deactivated: ${id}`);
    
    return workflow;
  }

  async execute(id: string, executeWorkflowDto?: ExecuteWorkflowDto): Promise<{ executionId: string }> {
    const workflow = await this.findOne(id);
    
    const executionId = this.generateId();
    
    // Add execution job to queue (core n8n functionality)
    await this.workflowQueue.add('execute-workflow', {
      executionId,
      workflowId: id,
      workflow,
      inputData: executeWorkflowDto?.inputData,
      runData: executeWorkflowDto?.runData,
      mode: executeWorkflowDto?.mode || 'manual',
    });

    this.logger.log(`Workflow execution queued: ${id} (execution: ${executionId})`);
    
    return { executionId };
  }

  async duplicate(id: string, newName?: string): Promise<Workflow> {
    const originalWorkflow = await this.findOne(id);
    
    const duplicatedWorkflow: Workflow = {
      ...originalWorkflow,
      id: this.generateId(),
      name: newName || `${originalWorkflow.name} (Copy)`,
      active: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      versionId: 1,
    };

    this.workflows.set(duplicatedWorkflow.id, duplicatedWorkflow);
    this.logger.log(`Workflow duplicated: ${id} -> ${duplicatedWorkflow.id}`);
    
    return duplicatedWorkflow;
  }

  async getExecutions(id: string, page = 1, limit = 50) {
    // This would typically fetch from a database
    // For now, return mock data
    return {
      executions: [],
      total: 0,
    };
  }

  private validateWorkflow(workflow: Workflow): void {
    if (!workflow.nodes || workflow.nodes.length === 0) {
      throw new BadRequestException('Workflow must have at least one node');
    }

    // Check for trigger nodes (n8n requirement)
    const triggerNodes = workflow.nodes.filter(node => 
      node.type.includes('trigger') || node.type.includes('webhook')
    );

    if (triggerNodes.length === 0) {
      throw new BadRequestException('Workflow must have at least one trigger node');
    }

    // Validate node connections
    for (const connection of workflow.connections) {
      const sourceExists = workflow.nodes.some(node => node.id === connection.sourceNodeId);
      const targetExists = workflow.nodes.some(node => node.id === connection.targetNodeId);
      
      if (!sourceExists || !targetExists) {
        throw new BadRequestException('Invalid node connection detected');
      }
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
