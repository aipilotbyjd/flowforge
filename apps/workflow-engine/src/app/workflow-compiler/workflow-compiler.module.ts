import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workflow } from '@flowforge/core/entities';
import { WorkflowCompilerService } from './workflow-compiler.service';
import { WorkflowCompilerController } from './workflow-compiler.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Workflow])],
  controllers: [WorkflowCompilerController],
  providers: [WorkflowCompilerService],
  exports: [WorkflowCompilerService],
})
export class WorkflowCompilerModule {}
