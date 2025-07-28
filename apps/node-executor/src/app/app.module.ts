import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { WorkflowEngineExecutorModule } from '@flowforge/workflow-engine/executor';
import { DataAccessDatabaseModule } from '@flowforge/data-access/database';
import { InfrastructureQueueModule } from '@flowforge/infrastructure/queue';
import { InfrastructureCacheModule } from '@flowforge/infrastructure/cache';
import { ObservabilityLoggingModule } from '@flowforge/observability-logging';
import { ObservabilityMetricsModule } from '@flowforge/observability/metrics';
import { SecurityAuthModule } from '@flowforge/security/auth';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ExecutionModule } from './execution/execution.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // Core configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      expandVariables: true,
    }),
    
    // Scheduling
    ScheduleModule.forRoot(),
    
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
    DataAccessDatabaseModule,
    InfrastructureQueueModule,
    InfrastructureCacheModule,
    ObservabilityLoggingModule,
    ObservabilityMetricsModule,
    SecurityAuthModule,
    
    // Feature modules
    ExecutionModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
