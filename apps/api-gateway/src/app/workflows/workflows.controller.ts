import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { WorkflowsService } from './workflows.service';
import { CreateWorkflowDto, UpdateWorkflowDto, ExecuteWorkflowDto } from './dto';
import { WorkflowEntity } from '../types/workflow.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../types/user-role.enum';

@ApiTags('workflows')
@Controller('workflows')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ 
    summary: 'Create a new workflow',
    description: 'Creates a new workflow with nodes and connections' 
  })
  @ApiBody({ type: CreateWorkflowDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Workflow created successfully',
    schema: {
      example: {
        success: true,
        data: {
          id: 'wf_123',
          name: 'Sample Workflow',
          description: 'A sample workflow for testing',
          status: 'draft',
          nodes: [],
          connections: [],
          createdAt: '2024-01-01T00:00:00Z'
        },
        message: 'Workflow created successfully'
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid workflow data'
  })
  async create(
    @Body() createWorkflowDto: CreateWorkflowDto,
    @Req() req: any
  ) {
    const workflow = await this.workflowsService.create(
      createWorkflowDto,
      req.user.id,
      req.user.organizationId
    );
    
    return {
      success: true,
      data: workflow,
      message: 'Workflow created successfully'
    };
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all workflows',
    description: 'Retrieves all workflows for the current organization with pagination and filtering' 
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'status', required: false, enum: ['draft', 'active', 'inactive', 'archived'], description: 'Filter by status' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in workflow names and descriptions' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort field (default: createdAt)' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], description: 'Sort order (default: DESC)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Workflows retrieved successfully',
    schema: {
      example: {
        success: true,
        data: [
          {
            id: 'wf_123',
            name: 'Sample Workflow',
            description: 'A sample workflow',
            status: 'active',
            createdAt: '2024-01-01T00:00:00Z'
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 100,
          pages: 5,
          hasNext: true,
          hasPrevious: false
        },
        message: 'Workflows retrieved successfully'
      }
    }
  })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy: string = 'createdAt',
    @Query('sortOrder') sortOrder: 'ASC' | 'DESC' = 'DESC',
    @Req() req: any
  ) {
    const result = await this.workflowsService.findAll(
      req.user.organizationId,
      {
        page,
        limit,
        status,
        search,
        sortBy,
        sortOrder
      }
    );

    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: 'Workflows retrieved successfully'
    };
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get workflow by ID',
    description: 'Retrieves a specific workflow by its ID' 
  })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Workflow retrieved successfully'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Workflow not found'
  })
  async findOne(
    @Param('id') id: string,
    @Req() req: any
  ) {
    const workflow = await this.workflowsService.findOne(
      id,
      req.user.organizationId
    );

    return {
      success: true,
      data: workflow,
      message: 'Workflow retrieved successfully'
    };
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ 
    summary: 'Update workflow',
    description: 'Updates an existing workflow' 
  })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiBody({ type: UpdateWorkflowDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Workflow updated successfully'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Workflow not found'
  })
  async update(
    @Param('id') id: string,
    @Body() updateWorkflowDto: UpdateWorkflowDto,
    @Req() req: any
  ) {
    const workflow = await this.workflowsService.update(
      id,
      updateWorkflowDto,
      req.user.organizationId
    );

    return {
      success: true,
      data: workflow,
      message: 'Workflow updated successfully'
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ 
    summary: 'Delete workflow',
    description: 'Deletes a workflow permanently' 
  })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Workflow deleted successfully'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Workflow not found'
  })
  async remove(
    @Param('id') id: string,
    @Req() req: any
  ) {
    await this.workflowsService.remove(id, req.user.organizationId);

    return {
      success: true,
      message: 'Workflow deleted successfully'
    };
  }

  @Post(':id/execute')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ 
    summary: 'Execute workflow',
    description: 'Triggers execution of a workflow' 
  })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiBody({ type: ExecuteWorkflowDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Workflow execution started',
    schema: {
      example: {
        success: true,
        data: {
          executionId: 'exec_123',
          workflowId: 'wf_123',
          status: 'queued',
          startedAt: '2024-01-01T00:00:00Z'
        },
        message: 'Workflow execution started'
      }
    }
  })
  async execute(
    @Param('id') id: string,
    @Body() executeWorkflowDto: ExecuteWorkflowDto,
    @Req() req: any
  ) {
    const execution = await this.workflowsService.execute(
      id,
      executeWorkflowDto,
      req.user.id,
      req.user.organizationId
    );

    return {
      success: true,
      data: execution,
      message: 'Workflow execution started'
    };
  }

  @Post(':id/activate')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ 
    summary: 'Activate workflow',
    description: 'Activates a workflow to make it available for execution' 
  })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Workflow activated successfully'
  })
  async activate(
    @Param('id') id: string,
    @Req() req: any
  ) {
    const workflow = await this.workflowsService.updateStatus(
      id,
      'active',
      req.user.organizationId
    );

    return {
      success: true,
      data: workflow,
      message: 'Workflow activated successfully'
    };
  }

  @Post(':id/deactivate')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ 
    summary: 'Deactivate workflow',
    description: 'Deactivates a workflow to prevent execution' 
  })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Workflow deactivated successfully'
  })
  async deactivate(
    @Param('id') id: string,
    @Req() req: any
  ) {
    const workflow = await this.workflowsService.updateStatus(
      id,
      'inactive',
      req.user.organizationId
    );

    return {
      success: true,
      data: workflow,
      message: 'Workflow deactivated successfully'
    };
  }

  @Post(':id/duplicate')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ 
    summary: 'Duplicate workflow',
    description: 'Creates a copy of an existing workflow' 
  })
  @ApiParam({ name: 'id', description: 'Workflow ID to duplicate' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Workflow duplicated successfully'
  })
  async duplicate(
    @Param('id') id: string,
    @Req() req: any
  ) {
    const workflow = await this.workflowsService.duplicate(
      id,
      req.user.id,
      req.user.organizationId
    );

    return {
      success: true,
      data: workflow,
      message: 'Workflow duplicated successfully'
    };
  }

  @Get(':id/executions')
  @ApiOperation({ 
    summary: 'Get workflow executions',
    description: 'Retrieves execution history for a specific workflow' 
  })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'running', 'completed', 'failed', 'cancelled'] })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Workflow executions retrieved successfully'
  })
  async getExecutions(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: string,
    @Req() req: any
  ) {
    const result = await this.workflowsService.getExecutions(
      id,
      req.user.organizationId,
      { page, limit, status }
    );

    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: 'Workflow executions retrieved successfully'
    };
  }
}
