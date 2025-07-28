import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { WorkflowEngineExecutorModule } from '@flowforge/workflow-engine/executor';
import { WorkflowEngineCompilerModule } from '@flowforge/workflow-engine/compiler';
import { WorkflowEngineValidatorModule } from '@flowforge/workflow-engine/validator';
import { DataAccessDatabaseModule } from '@flowforge/data-access/database';
import { InfrastructureQueueModule } from '@flowforge/infrastructure/queue';
import { ObservabilityLoggingModule } from '@flowforge/observability-logging';
import { SecurityAuthModule } from '@flowforge/security/auth';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WorkflowExecutionModule } from './workflow-execution/workflow-execution.module';
import { WorkflowCompilerModule } from './workflow-compiler/workflow-compiler.module';

@Module({
  imports: [
    // Core configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      expandVariables: true,
    }),
    
    // Queue management
    BullModule.forRootAsync({
      useFactory: () => ({
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379,
          password: process.env.REDIS_PASSWORD,
        },
      }),
    }),
    
    // Infrastructure modules
    WorkflowEngineExecutorModule,
    WorkflowEngineCompilerModule,
    WorkflowEngineValidatorModule,
    DataAccessDatabaseModule,
    InfrastructureQueueModule,
    ObservabilityLoggingModule,
    SecurityAuthModule,
    
    // Feature modules
    WorkflowExecutionModule,
    WorkflowCompilerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
