import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bull';
import { WorkflowExecutionService } from './workflow-execution.service';
import { WorkflowExecutorService } from '@flowforge/workflow-engine/executor';
import { WorkflowExecutionStatus } from '@flowforge/core-types';

interface WorkflowExecutionJob {
  executionId: string;
  workflowId: string;
  userId?: string;
  mode: string;
  inputData: any;
  triggerNode?: string;
}

@Processor('workflow-execution')
@Injectable()
export class WorkflowExecutionProcessor {
  private readonly logger = new Logger(WorkflowExecutionProcessor.name);

  constructor(
    private readonly executionService: WorkflowExecutionService,
    private readonly workflowExecutor: WorkflowExecutorService,
  ) {}

  @Process('execute-workflow')
  async handleWorkflowExecution(job: Job<WorkflowExecutionJob>) {
    const { executionId, workflowId, mode, inputData, triggerNode } = job.data;
    
    this.logger.log(`Processing workflow execution ${executionId} for workflow ${workflowId}`);

    try {
      // Update job progress
      await job.progress(10);

      // Get execution details
      const execution = await this.executionService.getExecution(executionId);
      
      if (execution.status !== WorkflowExecutionStatus.RUNNING) {
        this.logger.warn(`Execution ${executionId} is not in running state, skipping`);
        return;
      }

      // Update progress
      await job.progress(20);

      // Execute the workflow using the workflow executor
      const result = await this.workflowExecutor.executeWorkflow({
        executionId,
        workflowId,
        nodes: execution.executionData.nodes,
        connections: execution.executionData.connections,
        settings: execution.executionData.settings,
        inputData,
        triggerNode,
        mode,
      });

      // Update progress
      await job.progress(90);

      // Update execution status based on result
      if (result.success) {
        await this.executionService.updateExecutionStatus(
          executionId,
          WorkflowExecutionStatus.SUCCESS,
        );
        this.logger.log(`Workflow execution ${executionId} completed successfully`);
      } else {
        await this.executionService.updateExecutionStatus(
          executionId,
          WorkflowExecutionStatus.ERROR,
          result.error || 'Unknown execution error',
        );
        this.logger.error(`Workflow execution ${executionId} failed: ${result.error}`);
      }

      // Mark job as complete
      await job.progress(100);

    } catch (error) {
      this.logger.error(`Error processing workflow execution ${executionId}:`, error);

      // Update execution status to error
      await this.executionService.updateExecutionStatus(
        executionId,
        WorkflowExecutionStatus.ERROR,
        error.message || 'Unexpected execution error',
      );

      // Re-throw error to mark job as failed
      throw error;
    }
  }

  @Process('retry-failed-execution')
  async handleRetryExecution(job: Job<{ executionId: string }>) {
    const { executionId } = job.data;
    
    this.logger.log(`Retrying failed execution ${executionId}`);

    try {
      const execution = await this.executionService.getExecution(executionId);
      
      // Reset execution status to running
      await this.executionService.updateExecutionStatus(
        executionId,
        WorkflowExecutionStatus.RUNNING,
      );

      // Create a new execution job
      const executionData = execution.executionData;
      const retryJob: WorkflowExecutionJob = {
        executionId,
        workflowId: execution.workflow.id,
        mode: execution.mode,
        inputData: executionData.inputData,
        triggerNode: executionData.triggerNode,
      };

      // Add to execution queue with retry priority
      await job.queue.add('execute-workflow', retryJob, {
        priority: 0, // Higher priority for retries
        delay: 5000, // 5 second delay
      });

      this.logger.log(`Retry job created for execution ${executionId}`);

    } catch (error) {
      this.logger.error(`Error creating retry job for execution ${executionId}:`, error);
      throw error;
    }
  }

  @Process('cleanup-old-executions')
  async handleCleanupOldExecutions(job: Job<{ olderThanDays: number }>) {
    const { olderThanDays } = job.data;
    
    this.logger.log(`Cleaning up executions older than ${olderThanDays} days`);

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      // Note: This would require additional repository methods
      // For now, just log the cleanup attempt
      this.logger.log(`Would clean up executions older than ${cutoffDate.toISOString()}`);

      // In a real implementation, you would:
      // 1. Find old executions
      // 2. Archive important data
      // 3. Delete old records
      // 4. Clean up associated files/logs

    } catch (error) {
      this.logger.error('Error during execution cleanup:', error);
      throw error;
    }
  }
}
