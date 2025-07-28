import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { WorkflowEngineExecutorModule } from '@flowforge/workflow-engine/executor';
import { WorkflowEngineCompilerModule } from '@flowforge/workflow-engine/compiler';
import { WorkflowEngineValidatorModule } from '@flowforge/workflow-engine/validator';
import { DataAccessRepositoriesModule } from '@flowforge/data-access/repositories';
import { SecurityAuthModule } from '@flowforge/security/auth';
import { SecurityRbacModule } from '@flowforge/security/rbac';
import { ObservabilityLoggingModule } from '@flowforge/observability-logging';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsService } from './workflows.service';
import { WorkflowExecutionProcessor } from './workflow-execution.processor';

@Module({
  imports: [
    // Queue for workflow execution
    BullModule.registerQueue({
      name: 'workflow-execution',
    }),
    
    // Core workflow engine modules
    WorkflowEngineExecutorModule,
    WorkflowEngineCompilerModule,
    WorkflowEngineValidatorModule,
    
    // Data access
    DataAccessRepositoriesModule,
    
    // Security
    SecurityAuthModule,
    SecurityRbacModule,
    
    // Observability
    ObservabilityLoggingModule,
  ],
  controllers: [WorkflowsController],
  providers: [WorkflowsService, WorkflowExecutionProcessor],
  exports: [WorkflowsService],
})
export class WorkflowsModule {}
