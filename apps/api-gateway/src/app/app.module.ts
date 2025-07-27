import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Infrastructure Modules
import { DataAccessDatabaseModule } from '@flowforge/data-access/database';

// Application modules
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Feature modules
import { AuthModule } from './auth/auth.module';
import { WorkflowsModule } from './workflows/workflows.module';

@Module({
  imports: [
    // Core configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      expandVariables: true,
    }),

    // Infrastructure modules
    DataAccessDatabaseModule,
    
    // Feature modules
    AuthModule,
    WorkflowsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
