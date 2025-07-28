import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { DataAccessDatabaseModule } from '@flowforge/data-access/database';
import { WorkflowEngineExecutorModule } from '@flowforge/workflow-engine/executor';
import { InfrastructureQueueModule } from '@flowforge/infrastructure/queue';
import { InfrastructureCacheModule } from '@flowforge/infrastructure/cache';
import { ObservabilityLoggingModule } from '@flowforge/observability-logging';
import { ObservabilityMetricsModule } from '@flowforge/observability/metrics';
import { SecurityAuthModule } from '@flowforge/security/auth';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SchedulesModule } from './schedules/schedules.module';
import { CronModule } from './cron/cron.module';
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
    
    // Queue management for scheduled jobs
    BullModule.forRootAsync({
      useFactory: () => ({
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379,
          password: process.env.REDIS_PASSWORD,
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      }),
    }),
    
    // Infrastructure modules
    DataAccessDatabaseModule,
    WorkflowEngineExecutorModule,
    InfrastructureQueueModule,
    InfrastructureCacheModule,
    ObservabilityLoggingModule,
    ObservabilityMetricsModule,
    SecurityAuthModule,
    
    // Feature modules
    SchedulesModule,
    CronModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
