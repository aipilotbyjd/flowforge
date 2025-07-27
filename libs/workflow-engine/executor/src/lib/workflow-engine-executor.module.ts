import { Module } from '@nestjs/common';
import { WorkflowExecutorService } from './workflow-executor.service';
import { NodeExecutorService } from './node-executor.service';
import { ExecutionQueueService } from './execution-queue.service';

@Module({
  providers: [
    WorkflowExecutorService,
    NodeExecutorService,
    ExecutionQueueService,
  ],
  exports: [
    WorkflowExecutorService,
    NodeExecutorService,
    ExecutionQueueService,
  ],
})
export class WorkflowEngineExecutorModule {}
