import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Optional } from '@nestjs/common';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { WorkflowEntity } from './types';
import { WorkflowExecutorService } from './workflow-executor.service';
import { NodeExecutorService } from './node-executor.service';
import { LoggingService, LogContext } from '@flowforge/observability-logging';
import { ErrorHandlerService } from '@flowforge/observability-monitoring';
import { CircuitBreakerService } from '@flowforge/observability-monitoring';
import { ExecutionMonitorService } from '@flowforge/observability-monitoring';

export interface QueuedWorkflowExecution {
  id: string;
  workflowId: string;
  workflow: WorkflowEntity;
  inputData: Record<string, any>;
  mode: 'manual' | 'webhook' | 'schedule' | 'trigger';
  priority: number;
  retryCount: number;
  maxRetries: number;
  userId?: string;
  organizationId: string;
  metadata?: {
    webhookId?: string;
    scheduleId?: string;
    triggeredBy?: string;
    [key: string]: any;
  };
  createdAt: Date;
}

export interface QueuedNodeExecution {
  id: string;
  executionId: string;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  inputData: any;
  nodeParameters: any;
  retryCount: number;
  maxRetries: number;
  continueOnFail: boolean;
  runIndex: number;
  itemIndex?: number;
  credentialId?: string;
  metadata?: Record<string, any>;
}

@Injectable()
@Processor('workflow-execution')
export class ExecutionQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ExecutionQueueService.name);
  private readonly executionHistory = new Map<string, QueuedWorkflowExecution>();
  private readonly activeExecutions = new Map<string, QueuedWorkflowExecution>();
  private isProcessing = false;

  constructor(
    @InjectQueue('workflow-execution') private workflowQueue: Queue,
    @InjectQueue('node-execution') private nodeQueue: Queue,
    private workflowExecutorService: WorkflowExecutorService,
    private nodeExecutorService: NodeExecutorService,
    @Optional() private loggingService?: LoggingService,
    @Optional() private errorHandlerService?: ErrorHandlerService,
    @Optional() private circuitBreakerService?: CircuitBreakerService,
    @Optional() private executionMonitorService?: ExecutionMonitorService,
  ) {}

  async onModuleInit() {
    this.logger.log('Execution Queue Service initialized');
    await this.setupQueueEventListeners();
  }

  async onModuleDestroy() {
    this.logger.log('Shutting down Execution Queue Service');
    await this.workflowQueue.close();
    await this.nodeQueue.close();
  }

  /**
   * Queue a workflow for execution
   */
  async queueWorkflow(
    workflow: WorkflowEntity, 
    inputData: Record<string, any> = {},
    options: {
      mode?: 'manual' | 'webhook' | 'schedule' | 'trigger';
      priority?: number;
      delay?: number;
      maxRetries?: number;
      userId?: string;
      organizationId: string;
      metadata?: Record<string, any>;
    } = { organizationId: 'default' }
  ): Promise<string> {
    const executionId = this.generateExecutionId();
    
    const queuedExecution: QueuedWorkflowExecution = {
      id: executionId,
      workflowId: workflow.id,
      workflow,
      inputData,
      mode: options.mode || 'manual',
      priority: options.priority || 0,
      retryCount: 0,
      maxRetries: options.maxRetries || 3,
      userId: options.userId,
      organizationId: options.organizationId,
      metadata: options.metadata,
      createdAt: new Date(),
    };

    // Store in execution history
    this.executionHistory.set(executionId, queuedExecution);

    // Add to Bull queue
    const job = await this.workflowQueue.add(
      'execute-workflow',
      queuedExecution,
      {
        priority: options.priority || 0,
        delay: options.delay || 0,
        attempts: (options.maxRetries || 3) + 1,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 50, // Keep last 50 failed jobs
      }
    );

    this.logger.log(`Queued workflow execution: ${executionId} (Job ID: ${job.id})`);
    return executionId;
  }

  /**
   * Queue a node for execution
   */
  async queueNode(
    nodeExecution: QueuedNodeExecution,
    options: {
      priority?: number;
      delay?: number;
    } = {}
  ): Promise<void> {
    await this.nodeQueue.add(
      'execute-node',
      nodeExecution,
      {
        priority: options.priority || 0,
        delay: options.delay || 0,
        attempts: nodeExecution.maxRetries + 1,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: 200,
        removeOnFail: 100,
      }
    );

    this.logger.debug(`Queued node execution: ${nodeExecution.nodeId} for execution ${nodeExecution.executionId}`);
  }

  /**
   * Process workflow execution job
   */
  @Process('execute-workflow')
  async processWorkflowExecution(job: Job<QueuedWorkflowExecution>) {
    const execution = job.data;
    const executionId = execution.id;
    const startTime = Date.now();

    const logContext: LogContext = {
      executionId,
      workflowId: execution.workflowId,
      userId: execution.userId,
      organizationId: execution.organizationId,
      correlationId: `exec_${executionId}`,
      metadata: {
        mode: execution.mode,
        retryCount: execution.retryCount,
        ...execution.metadata,
      },
    };

    // Record execution start in monitoring system
    this.executionMonitorService?.recordExecutionStart('workflow', executionId, logContext);
    this.loggingService?.logExecutionStart(logContext);
    
    this.activeExecutions.set(executionId, execution);

    try {
      await job.progress(10);

      // Execute workflow with circuit breaker protection if available, otherwise execute directly
      const result = this.circuitBreakerService 
        ? await this.circuitBreakerService.execute(
            `workflow-executor`,
            () => this.workflowExecutorService.executeWorkflow(
              execution.workflow,
              execution.inputData,
              {
                executionId,
                mode: execution.mode,
                userId: execution.userId,
                organizationId: execution.organizationId,
                metadata: execution.metadata,
              }
            ),
            logContext,
            {
              failureThreshold: 5,
              timeout: 300000, // 5 minutes
            }
          )
        : await this.workflowExecutorService.executeWorkflow(
            execution.workflow,
            execution.inputData,
            {
              executionId,
              mode: execution.mode,
              userId: execution.userId,
              organizationId: execution.organizationId,
              metadata: execution.metadata,
            }
          );

      await job.progress(100);
      const duration = Date.now() - startTime;

      // Record successful completion
      this.executionMonitorService?.recordExecutionComplete(
        'workflow',
        executionId,
        duration,
        logContext
      );
      
      this.loggingService?.logExecutionComplete(logContext, duration, result);
      this.logger.log(`Workflow execution completed: ${executionId} (${duration}ms)`);

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Process error through error handler
      const processedError = this.errorHandlerService?.processError(error as Error, logContext);
      
      // Record execution failure
      this.executionMonitorService?.recordExecutionFailure(
        'workflow',
        executionId,
        duration,
        error as Error,
        logContext
      );

      // Update retry count
      execution.retryCount++;
      this.executionHistory.set(executionId, execution);

      // Check if should retry based on error analysis
      if (processedError && this.errorHandlerService?.shouldRetry(processedError, execution.retryCount)) {
        const retryDelay = this.errorHandlerService.calculateRetryDelay(processedError, execution.retryCount);
        
        this.loggingService?.logRetryAttempt(
          logContext,
          execution.retryCount,
          execution.maxRetries,
          `Error: ${error.message}`
        );

        // Schedule retry with calculated delay
        setTimeout(() => {
          this.retryExecution(executionId);
        }, retryDelay);
      }

      throw error;
    } finally {
      this.activeExecutions.delete(executionId);
    }
  }

  /**
   * Process node execution job
   */
  @Process('execute-node')
  async processNodeExecution(job: Job<QueuedNodeExecution>) {
    const nodeExecution = job.data;
    const startTime = Date.now();
    
    const logContext: LogContext = {
      executionId: nodeExecution.executionId,
      nodeId: nodeExecution.nodeId,
      correlationId: `node_${nodeExecution.nodeId}`,
      metadata: {
        nodeType: nodeExecution.nodeType,
        nodeName: nodeExecution.nodeName,
        retryCount: nodeExecution.retryCount,
        continueOnFail: nodeExecution.continueOnFail,
        ...nodeExecution.metadata,
      },
    };

    // Record node execution start
    this.executionMonitorService?.recordExecutionStart('node', nodeExecution.nodeId, logContext);
    this.loggingService?.logNodeExecution(logContext, nodeExecution.nodeType, 'started');

    try {
      await job.progress(10);

      // Execute node with circuit breaker protection if available, otherwise execute directly
      const result = this.circuitBreakerService
        ? await this.circuitBreakerService.execute(
            `node-executor-${nodeExecution.nodeType}`,
            () => this.nodeExecutorService.executeNode(
              nodeExecution.nodeType,
              nodeExecution.inputData,
              {
                nodeId: nodeExecution.nodeId,
                nodeName: nodeExecution.nodeName,
                parameters: nodeExecution.nodeParameters,
                executionId: nodeExecution.executionId,
                credentialId: nodeExecution.credentialId,
                continueOnFail: nodeExecution.continueOnFail,
                runIndex: nodeExecution.runIndex,
                itemIndex: nodeExecution.itemIndex,
                metadata: nodeExecution.metadata,
              }
            ),
            logContext,
            {
              failureThreshold: 3,
              timeout: 60000, // 1 minute for node execution
            }
          )
        : await this.nodeExecutorService.executeNode(
            nodeExecution.nodeType,
            nodeExecution.inputData,
            {
              nodeId: nodeExecution.nodeId,
              nodeName: nodeExecution.nodeName,
              parameters: nodeExecution.nodeParameters,
              executionId: nodeExecution.executionId,
              credentialId: nodeExecution.credentialId,
              continueOnFail: nodeExecution.continueOnFail,
              runIndex: nodeExecution.runIndex,
              itemIndex: nodeExecution.itemIndex,
              metadata: nodeExecution.metadata,
            }
          );

      await job.progress(100);
      const duration = Date.now() - startTime;
      
      // Record successful completion
      this.executionMonitorService?.recordExecutionComplete(
        'node',
        nodeExecution.nodeId,
        duration,
        logContext,
        nodeExecution.nodeType
      );
      
      this.loggingService?.logNodeExecution(logContext, nodeExecution.nodeType, 'completed', duration);
      
      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Process error through error handler
      const processedError = this.errorHandlerService?.processError(error as Error, logContext);
      
      // Record execution failure
      this.executionMonitorService?.recordExecutionFailure(
        'node',
        nodeExecution.nodeId,
        duration,
        error as Error,
        logContext,
        nodeExecution.nodeType
      );
      
      // Update retry count
      nodeExecution.retryCount++;

      // If continueOnFail is true, don't throw the error
      if (nodeExecution.continueOnFail) {
        this.loggingService?.logNodeExecution(
          logContext, 
          nodeExecution.nodeType, 
          'failed_continue', 
          duration
        );
        
        this.logger.warn(`Node failed but continuing due to continueOnFail: ${nodeExecution.nodeId}`);
        return { error: error.message, continueOnFail: true };
      }

      // Check if should retry based on error analysis
      if (processedError && this.errorHandlerService?.shouldRetry(processedError, nodeExecution.retryCount)) {
        const retryDelay = this.errorHandlerService.calculateRetryDelay(processedError, nodeExecution.retryCount);
        
        this.loggingService?.logRetryAttempt(
          logContext,
          nodeExecution.retryCount,
          nodeExecution.maxRetries,
          `Node error: ${error.message}`
        );
      }

      throw error;
    }
  }

  /**
   * Cancel a workflow execution
   */
  async cancelExecution(executionId: string): Promise<boolean> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      this.logger.warn(`Cannot cancel execution - not found or not active: ${executionId}`);
      return false;
    }

    try {
      // Find and remove jobs from queues
      const workflowJobs = await this.workflowQueue.getJobs(['waiting', 'active']);
      const nodeJobs = await this.nodeQueue.getJobs(['waiting', 'active']);

      for (const job of workflowJobs) {
        if (job.data.id === executionId) {
          await job.remove();
          this.logger.log(`Cancelled workflow job for execution: ${executionId}`);
        }
      }

      for (const job of nodeJobs) {
        if (job.data.executionId === executionId) {
          await job.remove();
          this.logger.debug(`Cancelled node job for execution: ${executionId}`);
        }
      }

      this.activeExecutions.delete(executionId);
      return true;

    } catch (error) {
      this.logger.error(`Failed to cancel execution: ${executionId}`, error);
      return false;
    }
  }

  /**
   * Get execution status
   */
  async getExecutionStatus(executionId: string): Promise<{
    id: string;
    status: 'queued' | 'active' | 'completed' | 'failed' | 'cancelled';
    progress: number;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    error?: string;
  } | null> {
    const execution = this.executionHistory.get(executionId);
    if (!execution) {
      return null;
    }

    // Check if execution is active
    const isActive = this.activeExecutions.has(executionId);
    
    // Get job status from Bull queue
    const jobs = await this.workflowQueue.getJobs(['waiting', 'active', 'completed', 'failed']);
    const job = jobs.find(j => j.data.id === executionId);

    let status: 'queued' | 'active' | 'completed' | 'failed' | 'cancelled' = 'queued';
    let progress = 0;
    let startedAt: Date | undefined;
    let completedAt: Date | undefined;
    let error: string | undefined;

    if (job) {
      switch (await job.getState()) {
        case 'waiting':
        case 'delayed':
          status = 'queued';
          break;
        case 'active':
          status = 'active';
          progress = job.progress() as number || 0;
          startedAt = new Date(job.processedOn || Date.now());
          break;
        case 'completed':
          status = 'completed';
          progress = 100;
          startedAt = new Date(job.processedOn || Date.now());
          completedAt = new Date(job.finishedOn || Date.now());
          break;
        case 'failed':
          status = 'failed';
          startedAt = new Date(job.processedOn || Date.now());
          completedAt = new Date(job.finishedOn || Date.now());
          error = job.failedReason;
          break;
      }
    } else if (isActive) {
      status = 'active';
    }

    return {
      id: executionId,
      status,
      progress,
      createdAt: execution.createdAt,
      startedAt,
      completedAt,
      error,
    };
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    workflow: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
      delayed: number;
    };
    node: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
      delayed: number;
    };
    activeExecutions: number;
    totalExecutions: number;
  }> {
    const [workflowCounts, nodeCounts] = await Promise.all([
      this.workflowQueue.getJobCounts(),
      this.nodeQueue.getJobCounts(),
    ]);

    return {
      workflow: workflowCounts,
      node: nodeCounts,
      activeExecutions: this.activeExecutions.size,
      totalExecutions: this.executionHistory.size,
    };
  }

  /**
   * Clean up old completed/failed jobs
   */
  async cleanupOldJobs(olderThanHours = 24): Promise<{ cleaned: number }> {
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
    
    const [workflowJobs, nodeJobs] = await Promise.all([
      this.workflowQueue.getJobs(['completed', 'failed']),
      this.nodeQueue.getJobs(['completed', 'failed']),
    ]);

    let cleaned = 0;

    for (const job of [...workflowJobs, ...nodeJobs]) {
      if (job.finishedOn && job.finishedOn < cutoffTime) {
        await job.remove();
        cleaned++;
      }
    }

    this.logger.log(`Cleaned up ${cleaned} old jobs`);
    return { cleaned };
  }

  /**
   * Retry a failed execution
   */
  async retryExecution(executionId: string): Promise<boolean> {
    const execution = this.executionHistory.get(executionId);
    if (!execution) {
      this.logger.warn(`Cannot retry execution - not found: ${executionId}`);
      return false;
    }

    if (execution.retryCount >= execution.maxRetries) {
      this.logger.warn(`Cannot retry execution - max retries reached: ${executionId}`);
      return false;
    }

    try {
      const newExecutionId = await this.queueWorkflow(
        execution.workflow,
        execution.inputData,
        {
          mode: execution.mode,
          priority: execution.priority + 1, // Higher priority for retries
          maxRetries: execution.maxRetries,
          userId: execution.userId,
          organizationId: execution.organizationId,
          metadata: {
            ...execution.metadata,
            isRetry: true,
            originalExecutionId: executionId,
            retryCount: execution.retryCount + 1,
          },
        }
      );

      this.logger.log(`Retrying execution ${executionId} as ${newExecutionId}`);
      return true;

    } catch (error) {
      this.logger.error(`Failed to retry execution: ${executionId}`, error);
      return false;
    }
  }

  private async setupQueueEventListeners() {
    this.workflowQueue.on('completed', (job, result) => {
      this.logger.log(`Workflow job completed: ${job.data.id}`);
    });

    this.workflowQueue.on('failed', (job, error) => {
      this.logger.error(`Workflow job failed: ${job.data.id}`, error);
    });

    this.nodeQueue.on('completed', (job, result) => {
      this.logger.debug(`Node job completed: ${job.data.nodeId}`);
    });

    this.nodeQueue.on('failed', (job, error) => {
      this.logger.error(`Node job failed: ${job.data.nodeId}`, error);
    });

    this.workflowQueue.on('stalled', (job) => {
      this.logger.warn(`Workflow job stalled: ${job.data.id}`);
    });

    this.nodeQueue.on('stalled', (job) => {
      this.logger.warn(`Node job stalled: ${job.data.nodeId}`);
    });
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
