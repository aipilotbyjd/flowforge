import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { HttpModule } from '@nestjs/axios';
import { DataAccessDatabaseModule } from '@flowforge/data-access/database';
import { InfrastructureQueueModule } from '@flowforge/infrastructure/queue';
import { InfrastructureCacheModule } from '@flowforge/infrastructure/cache';
import { ObservabilityLoggingModule } from '@flowforge/observability-logging';
import { ObservabilityMetricsModule } from '@flowforge/observability/metrics';
import { SecurityAuthModule } from '@flowforge/security/auth';
import { SecurityRbacModule } from '@flowforge/security/rbac';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ReportsModule } from './reports/reports.module';
import { MetricsModule } from './metrics/metrics.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // Core configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      expandVariables: true,
    }),

    // Scheduling for periodic data aggregation
    ScheduleModule.forRoot(),

    // HTTP client for external data sources
    HttpModule,

    // Queue management for async processing
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
    DataAccessDatabaseModule,
    InfrastructureQueueModule,
    InfrastructureCacheModule,
    ObservabilityLoggingModule,
    ObservabilityMetricsModule,
    SecurityAuthModule,
    SecurityRbacModule,

    // Feature modules
    ReportsModule,
    MetricsModule,
    DashboardModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
