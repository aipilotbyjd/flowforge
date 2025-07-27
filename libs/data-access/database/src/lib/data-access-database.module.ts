import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  User,
  Organization,
  UserSession,
  Workflow,
  WorkflowExecution,
  Credential,
  ApiKey,
  WorkflowTag
} from '@flowforge/core/entities';

@Global()
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: parseInt(configService.get('DATABASE_PORT', '5432'), 10),
        username: configService.get('DATABASE_USERNAME', 'flowforge'),
        password: configService.get('DATABASE_PASSWORD', 'flowforge123'),
        database: configService.get('DATABASE_NAME', 'flowforge'),
        entities: [
          User,
          Organization,
          UserSession,
          Workflow,
          WorkflowExecution,
          Credential,
          ApiKey,
          WorkflowTag
        ],
        synchronize: configService.get('DATABASE_SYNCHRONIZE', 'false') === 'true',
        logging: configService.get('DATABASE_LOGGING', 'false') === 'true',
        ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
        poolSize: 20,
        extra: {
          max: 30,
          min: 5,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DataAccessDatabaseModule {}
