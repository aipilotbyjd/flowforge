import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Workflow, WorkflowExecution } from '@flowforge/core-entities';
import { WorkflowExecutionService } from './workflow-execution.service';
import { WorkflowExecutionController } from './workflow-execution.controller';
import { WorkflowExecutionProcessor } from './workflow-execution.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workflow, WorkflowExecution]),
    BullModule.registerQueue({
      name: 'workflow-execution',
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    }),
  ],
  controllers: [WorkflowExecutionController],
  providers: [WorkflowExecutionService, WorkflowExecutionProcessor],
  exports: [WorkflowExecutionService],
})
export class WorkflowExecutionModule {}
