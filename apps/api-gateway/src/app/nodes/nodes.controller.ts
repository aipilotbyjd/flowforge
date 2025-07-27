import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { NodesService } from './nodes.service';

export interface NodeType {
  name: string;
  displayName: string;
  description: string;
  version: number;
  defaults: {
    name: string;
    color: string;
  };
  inputs: string[];
  outputs: string[];
  credentials?: {
    name: string;
    required: boolean;
  }[];
  properties: NodeProperty[];
  group: string[];
  icon?: string;
  codex?: {
    categories: string[];
    subcategories: string[];
    resources: {
      primaryDocumentation: {
        url: string;
      }[];
    };
  };
}

export interface NodeProperty {
  displayName: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'options' | 'collection' | 'fixedCollection' | 'multiOptions' | 'json' | 'notice';
  default: any;
  required?: boolean;
  description?: string;
  options?: { name: string; value: any; description?: string }[];
  placeholder?: string;
  typeOptions?: Record<string, any>;
}

@ApiTags('nodes')
@Controller('nodes')
export class NodesController {
  constructor(private readonly nodesService: NodesService) {}

  @Get('types')
  @ApiOperation({ summary: 'Get all available node types (n8n node catalog)' })
  @ApiResponse({ status: 200, description: 'Node types retrieved successfully' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'search', required: false, description: 'Search node types' })
  async getNodeTypes(
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.nodesService.getNodeTypes(category, search);
  }

  @Get('types/:nodeType')
  @ApiOperation({ summary: 'Get specific node type definition' })
  @ApiResponse({ status: 200, description: 'Node type definition retrieved' })
  @ApiParam({ name: 'nodeType', type: 'string' })
  async getNodeType(@Param('nodeType') nodeType: string) {
    return this.nodesService.getNodeType(nodeType);
  }

  @Post('test')
  @ApiOperation({ summary: 'Test node execution with parameters' })
  @ApiResponse({ status: 200, description: 'Node test completed' })
  async testNode(@Body() testData: {
    nodeType: string;
    parameters: Record<string, any>;
    inputData?: any;
    credentials?: Record<string, any>;
  }) {
    return this.nodesService.testNode(testData);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all node categories' })
  @ApiResponse({ status: 200, description: 'Node categories retrieved' })
  async getCategories() {
    return this.nodesService.getCategories();
  }

  @Get('credentials')
  @ApiOperation({ summary: 'Get available credential types' })
  @ApiResponse({ status: 200, description: 'Credential types retrieved' })
  async getCredentialTypes() {
    return this.nodesService.getCredentialTypes();
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate node configuration' })
  @ApiResponse({ status: 200, description: 'Node configuration validated' })
  async validateNode(@Body() nodeConfig: {
    nodeType: string;
    parameters: Record<string, any>;
  }) {
    return this.nodesService.validateNodeConfiguration(nodeConfig);
  }

  @Get('documentation/:nodeType')
  @ApiOperation({ summary: 'Get node documentation' })
  @ApiResponse({ status: 200, description: 'Node documentation retrieved' })
  @ApiParam({ name: 'nodeType', type: 'string' })
  async getNodeDocumentation(@Param('nodeType') nodeType: string) {
    return this.nodesService.getNodeDocumentation(nodeType);
  }
}
