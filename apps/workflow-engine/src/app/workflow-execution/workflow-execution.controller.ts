import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  Delete,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@flowforge/security/auth';
import { ExecuteWorkflowDto } from '@flowforge/core/types';
import { WorkflowExecutionService } from './workflow-execution.service';

@ApiTags('workflow-execution')
@Controller('workflow-execution')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class WorkflowExecutionController {
  private readonly logger = new Logger(WorkflowExecutionController.name);

  constructor(private readonly executionService: WorkflowExecutionService) {}

  @Post()
  @ApiOperation({ summary: 'Execute a workflow manually' })
  @ApiResponse({ status: 201, description: 'Workflow execution started successfully' })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  @ApiResponse({ status: 400, description: 'Invalid workflow or inactive workflow' })
  async executeWorkflow(
    @Body() executeDto: ExecuteWorkflowDto,
    @Request() req: any,
  ) {
    this.logger.log(`Manual execution request for workflow ${executeDto.workflowId} by user ${req.user.id}`);
    
    const execution = await this.executionService.executeWorkflow(executeDto, req.user.id);
    
    return {
      success: true,
      message: 'Workflow execution started',
      data: {
        executionId: execution.id,
        workflowId: execution.workflow.id,
        status: execution.status,
        startTime: execution.startTime,
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workflow execution by ID' })
  @ApiResponse({ status: 200, description: 'Execution details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Execution not found' })
  async getExecution(@Param('id') executionId: string) {
    const execution = await this.executionService.getExecution(executionId);
    
    return {
      success: true,
      data: {
        id: execution.id,
        workflowId: execution.workflow.id,
        workflowName: execution.workflow.name,
        status: execution.status,
        mode: execution.mode,
        startTime: execution.startTime,
        endTime: execution.endTime,
        executionData: execution.executionData,
        errorMessage: execution.errorMessage,
      },
    };
  }

  @Get('workflow/:workflowId')
  @ApiOperation({ summary: 'Get executions for a specific workflow' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiResponse({ status: 200, description: 'Workflow executions retrieved successfully' })
  async getWorkflowExecutions(
    @Param('workflowId') workflowId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const { executions, total } = await this.executionService.getWorkflowExecutions(
      workflowId,
      Number(page),
      Number(limit),
    );

    return {
      success: true,
      data: {
        executions: executions.map(execution => ({
          id: execution.id,
          status: execution.status,
          mode: execution.mode,
          startTime: execution.startTime,
          endTime: execution.endTime,
          errorMessage: execution.errorMessage,
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a running workflow execution' })
  @ApiResponse({ status: 200, description: 'Execution cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Execution not found' })
  @ApiResponse({ status: 400, description: 'Cannot cancel non-running execution' })
  async cancelExecution(@Param('id') executionId: string) {
    const execution = await this.executionService.cancelExecution(executionId);
    
    return {
      success: true,
      message: 'Execution cancelled successfully',
      data: {
        id: execution.id,
        status: execution.status,
        endTime: execution.endTime,
      },
    };
  }

  @Get('stats/overview')
  @ApiOperation({ summary: 'Get overall execution statistics' })
  @ApiQuery({ name: 'workflowId', required: false, type: String, description: 'Filter by workflow ID' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getExecutionStats(@Query('workflowId') workflowId?: string) {
    const stats = await this.executionService.getExecutionStats(workflowId);
    
    return {
      success: true,
      data: stats,
    };
  }

  @Post('webhook/:workflowId/:nodeId')
  @ApiOperation({ summary: 'Execute workflow via webhook (internal use)' })
  @ApiResponse({ status: 201, description: 'Webhook execution started successfully' })
  async executeViaWebhook(
    @Param('workflowId') workflowId: string,
    @Param('nodeId') nodeId: string,
    @Body() webhookData: any,
  ) {
    this.logger.log(`Webhook execution request for workflow ${workflowId} via node ${nodeId}`);
    
    const execution = await this.executionService.executeWorkflowViaWebhook(
      workflowId,
      nodeId,
      webhookData,
    );
    
    return {
      success: true,
      message: 'Webhook execution started',
      data: {
        executionId: execution.id,
        workflowId: execution.workflow.id,
        status: execution.status,
        startTime: execution.startTime,
      },
    };
  }

  @Post('schedule/:workflowId')
  @ApiOperation({ summary: 'Execute workflow via schedule (internal use)' })
  @ApiResponse({ status: 201, description: 'Scheduled execution started successfully' })
  async executeViaSchedule(@Param('workflowId') workflowId: string) {
    this.logger.log(`Scheduled execution request for workflow ${workflowId}`);
    
    const execution = await this.executionService.executeWorkflowViaSchedule(workflowId);
    
    if (!execution) {
      return {
        success: false,
        message: 'Workflow is inactive, execution skipped',
      };
    }
    
    return {
      success: true,
      message: 'Scheduled execution started',
      data: {
        executionId: execution.id,
        workflowId: execution.workflow.id,
        status: execution.status,
        startTime: execution.startTime,
      },
    };
  }
}
