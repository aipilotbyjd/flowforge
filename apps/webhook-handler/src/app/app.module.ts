import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule } from '@nestjs/throttler';
import { DataAccessDatabaseModule } from '@flowforge/data-access/database';
import { WorkflowEngineExecutorModule } from '@flowforge/workflow-engine/executor';
import { InfrastructureQueueModule } from '@flowforge/infrastructure/queue';
import { InfrastructureCacheModule } from '@flowforge/infrastructure/cache';
import { ObservabilityLoggingModule } from '@flowforge/observability/logging';
import { ObservabilityMetricsModule } from '@flowforge/observability/metrics';
import { SecurityAuthModule } from '@flowforge/security/auth';
import { SecurityCryptoModule } from '@flowforge/security/crypto';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebhooksModule } from './webhooks/webhooks.module';
import { TriggersModule } from './triggers/triggers.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // Core configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      expandVariables: true,
    }),
    
    // Rate limiting for webhook endpoints
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        throttlers: [
          {
            ttl: 60000, // 1 minute
            limit: 1000, // 1000 requests per minute
          },
        ],
      }),
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
    DataAccessDatabaseModule,
    WorkflowEngineExecutorModule,
    InfrastructureQueueModule,
    InfrastructureCacheModule,
    ObservabilityLoggingModule,
    ObservabilityMetricsModule,
    SecurityAuthModule,
    SecurityCryptoModule,
    
    // Feature modules
    WebhooksModule,
    TriggersModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
