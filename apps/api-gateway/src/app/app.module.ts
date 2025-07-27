import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { HttpModule } from '@nestjs/axios';

// Infrastructure Modules
import { DataAccessDatabaseModule } from '@flowforge/data-access/database';
import { DataAccessRepositoriesModule } from '@flowforge/data-access/repositories';
import { InfrastructureQueueModule } from '@flowforge/infrastructure/queue';
import { InfrastructureCacheModule } from '@flowforge/infrastructure/cache';
import { InfrastructureConfigModule } from '@flowforge/infrastructure/config';
import { InfrastructureTelemetryModule } from '@flowforge/infrastructure/telemetry';

// Workflow Engine Modules
import { WorkflowEngineExecutorModule } from '@flowforge/workflow-engine/executor';
import { WorkflowEngineCompilerModule } from '@flowforge/workflow-engine/compiler';
import { WorkflowEngineValidatorModule } from '@flowforge/workflow-engine/validator';
import { WorkflowEngineOptimizerModule } from '@flowforge/workflow-engine/optimizer';

// Security Modules
import { SecurityAuthModule } from '@flowforge/security/auth';
import { SecurityRbacModule } from '@flowforge/security/rbac';
import { SecurityCryptoModule } from '@flowforge/security/crypto';
import { SecurityAuditModule } from '@flowforge/security/audit';

// Observability Modules
import { ObservabilityLoggingModule } from '@flowforge/observability/logging';
import { ObservabilityMetricsModule } from '@flowforge/observability/metrics';
import { ObservabilityTracingModule } from '@flowforge/observability/tracing';
import { ObservabilityMonitoringModule } from '@flowforge/observability/monitoring';

// Connector Modules
import { ConnectorsHttpModule } from '@flowforge/connectors/http';
import { ConnectorsDatabaseModule } from '@flowforge/connectors/database';
import { ConnectorsCloudModule } from '@flowforge/connectors/cloud';
import { ConnectorsMessagingModule } from '@flowforge/connectors/messaging';
import { ConnectorsEmailModule } from '@flowforge/connectors/email';

// Application modules
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Feature modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { WorkflowsModule } from './workflows/workflows.module';
import { ExecutionsModule } from './executions/executions.module';
import { NodesModule } from './nodes/nodes.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { HealthModule } from './health/health.module';
import { ConnectorsModule } from './connectors/connectors.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { SchedulesModule } from './schedules/schedules.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    // Core configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      expandVariables: true,
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        throttlers: [
          {
            ttl: 60000, // 1 minute
            limit: 100, // 100 requests per minute per IP
          },
        ],
      }),
    }),

    // HTTP client for external integrations
    HttpModule,

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
    DataAccessDatabaseModule,
    DataAccessRepositoriesModule,
    InfrastructureQueueModule,
    InfrastructureCacheModule,
    InfrastructureConfigModule,
    InfrastructureTelemetryModule,

    // Workflow Engine modules
    WorkflowEngineExecutorModule,
    WorkflowEngineCompilerModule,
    WorkflowEngineValidatorModule,
    WorkflowEngineOptimizerModule,

    // Security modules
    SecurityAuthModule,
    SecurityRbacModule,
    SecurityCryptoModule,
    SecurityAuditModule,

    // Observability modules
    ObservabilityLoggingModule,
    ObservabilityMetricsModule,
    ObservabilityTracingModule,
    ObservabilityMonitoringModule,

    // Connector modules
    ConnectorsHttpModule,
    ConnectorsDatabaseModule,
    ConnectorsCloudModule,
    ConnectorsMessagingModule,
    ConnectorsEmailModule,
    
    // Feature modules
    AuthModule,
    UsersModule,
    OrganizationsModule,
    WorkflowsModule,
    ExecutionsModule,
    NodesModule,
    WebhooksModule,
    HealthModule,
    ConnectorsModule,
    IntegrationsModule,
    SchedulesModule,
    NotificationsModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
