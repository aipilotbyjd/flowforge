import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { NodeExecutionRequest, NodeExecutionResult } from './execution.controller';

@Injectable()
export class ExecutionService {
  private readonly logger = new Logger(ExecutionService.name);

  constructor(@InjectQueue('node-execution') private readonly nodeExecutionQueue: Queue) {}

  async executeNode(request: NodeExecutionRequest): Promise<NodeExecutionResult> {
    this.logger.debug('Received executeNode request', request);
    const job = await this.nodeExecutionQueue.add(request);

    const completedJob = await job.finished();
    return completedJob.data;
  }

  async executeBatch(requests: NodeExecutionRequest[]) {
    this.logger.debug('Received executeBatch request');
    return await this.nodeExecutionQueue.addBulk(requests.map(request => ({ data: request })));
  }

  async getExecutionStatus(executionId: string) {
    const job = await this.getJob(executionId);
    return {
      id: job.id,
      status: job.finishedOn ? 'completed' : 'processing',
      progress: job.progress(),
    };
  }

  async getExecutionResults(executionId: string) {
    const job = await this.getJob(executionId);
    if (job.finishedOn) {
      return job.data;
    } else {
      throw new Error('Execution not yet completed');
    }
  }

  async getActiveExecutions(limit: number) {
    const jobs = await this.nodeExecutionQueue.getJobs(['active', 'waiting', 'delayed'], 0, limit);
    return jobs.map(job => ({ id: job.id, name: job.name, progress: job.progress() }));
  }

  async cancelExecution(executionId: string) {
    const job = await this.getJob(executionId);
    await job.remove();
    return { message: `Execution ${executionId} cancelled` };
  }

  private async getJob(executionId: string) {
    const job = await this.nodeExecutionQueue.getJob(executionId);
    if (!job) {
      throw new Error(`Execution ${executionId} not found`);
    }
    return job;
  }
}
