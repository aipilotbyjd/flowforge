import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { WorkflowEngineExecutorModule } from '@flowforge/workflow-engine/executor';
import { DataAccessRepositoriesModule } from '@flowforge/data-access/repositories';
import { ObservabilityLoggingModule } from '@flowforge/observability/logging';
import { ExecutionController } from './execution.controller';
import { ExecutionService } from './execution.service';
import { NodeExecutionProcessor } from './node-execution.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'node-execution',
    }),
    WorkflowEngineExecutorModule,
    DataAccessRepositoriesModule,
    ObservabilityLoggingModule,
  ],
  controllers: [ExecutionController],
  providers: [ExecutionService, NodeExecutionProcessor],
  exports: [ExecutionService],
})
export class ExecutionModule {}
