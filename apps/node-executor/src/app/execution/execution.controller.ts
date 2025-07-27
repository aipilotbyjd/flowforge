import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ExecutionService } from './execution.service';

export interface NodeExecutionRequest {
  nodeId: string;
  workflowId: string;
  executionId: string;
  nodeType: string;
  inputData: any;
  parameters: Record<string, any>;
  credentials?: Record<string, any>;
}

export interface NodeExecutionResult {
  success: boolean;
  outputData?: any;
  error?: string;
  executionTime: number;
  nodeId: string;
  executionId: string;
}

@ApiTags('node-execution')
@Controller('execution')
export class ExecutionController {
  constructor(private readonly executionService: ExecutionService) {}

  @Post('execute-node')
  @ApiOperation({ summary: 'Execute a single node (core n8n functionality)' })
  @ApiResponse({ status: 200, description: 'Node executed successfully' })
  @ApiBody({ 
    description: 'Node execution request',
    schema: {
      type: 'object',
      properties: {
        nodeId: { type: 'string' },
        workflowId: { type: 'string' },
        executionId: { type: 'string' },
        nodeType: { type: 'string' },
        inputData: { type: 'object' },
        parameters: { type: 'object' },
        credentials: { type: 'object' }
      }
    }
  })
  async executeNode(@Body() request: NodeExecutionRequest): Promise<NodeExecutionResult> {
    return this.executionService.executeNode(request);
  }

  @Post('execute-batch')
  @ApiOperation({ summary: 'Execute multiple nodes in batch' })
  @ApiResponse({ status: 200, description: 'Batch execution started' })
  async executeBatch(@Body() requests: NodeExecutionRequest[]) {
    return this.executionService.executeBatch(requests);
  }

  @Get('status/:executionId')
  @ApiOperation({ summary: 'Get execution status' })
  @ApiResponse({ status: 200, description: 'Execution status retrieved' })
  async getExecutionStatus(@Param('executionId') executionId: string) {
    return this.executionService.getExecutionStatus(executionId);
  }

  @Get('results/:executionId')
  @ApiOperation({ summary: 'Get execution results' })
  @ApiResponse({ status: 200, description: 'Execution results retrieved' })
  async getExecutionResults(@Param('executionId') executionId: string) {
    return this.executionService.getExecutionResults(executionId);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active executions' })
  @ApiResponse({ status: 200, description: 'Active executions retrieved' })
  async getActiveExecutions(@Query('limit') limit = 50) {
    return this.executionService.getActiveExecutions(limit);
  }

  @Post('cancel/:executionId')
  @ApiOperation({ summary: 'Cancel execution' })
  @ApiResponse({ status: 200, description: 'Execution cancelled' })
  async cancelExecution(@Param('executionId') executionId: string) {
    return this.executionService.cancelExecution(executionId);
  }
}
