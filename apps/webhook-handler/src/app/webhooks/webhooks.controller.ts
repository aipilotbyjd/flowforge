import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req, Res, HttpStatus, Logger, UseGuards, All } from '@nestjs/common';
import { Request, Response } from 'express';
import { WebhooksService } from './webhooks.service';
import { WebhookManagementService, WebhookRegistration } from './webhook-management.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';

export interface WebhookConfig {
  id: string;
  workflowId: string;
  nodeId: string;
  path: string;
  method: string;
  responseMode: 'onReceived' | 'lastNode';
  responseCode: number;
  responseData?: any;
  isActive: boolean;
}

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new webhook (n8n webhook node functionality)' })
  @ApiResponse({ status: 201, description: 'Webhook created successfully' })
  async createWebhook(@Body() webhookConfig: Partial<WebhookConfig>) {
    return this.webhooksService.createWebhook(webhookConfig);
  }

  @Get()
  @ApiOperation({ summary: 'List all webhooks' })
  @ApiResponse({ status: 200, description: 'Webhooks retrieved successfully' })
  @ApiQuery({ name: 'workflowId', required: false })
  async listWebhooks(@Query('workflowId') workflowId?: string) {
    return this.webhooksService.listWebhooks(workflowId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get webhook by ID' })
  @ApiResponse({ status: 200, description: 'Webhook retrieved successfully' })
  @ApiParam({ name: 'id', type: 'string' })
  async getWebhook(@Param('id') id: string) {
    return this.webhooksService.getWebhook(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update webhook configuration' })
  @ApiResponse({ status: 200, description: 'Webhook updated successfully' })
  @ApiParam({ name: 'id', type: 'string' })
  async updateWebhook(@Param('id') id: string, @Body() updates: Partial<WebhookConfig>) {
    return this.webhooksService.updateWebhook(id, updates);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete webhook' })
  @ApiResponse({ status: 200, description: 'Webhook deleted successfully' })
  @ApiParam({ name: 'id', type: 'string' })
  async deleteWebhook(@Param('id') id: string) {
    return this.webhooksService.deleteWebhook(id);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate webhook' })
  @ApiResponse({ status: 200, description: 'Webhook activated' })
  @ApiParam({ name: 'id', type: 'string' })
  async activateWebhook(@Param('id') id: string) {
    return this.webhooksService.activateWebhook(id);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate webhook' })
  @ApiResponse({ status: 200, description: 'Webhook deactivated' })
  @ApiParam({ name: 'id', type: 'string' })
  async deactivateWebhook(@Param('id') id: string) {
    return this.webhooksService.deactivateWebhook(id);
  }

  // Dynamic webhook endpoint handler (core n8n functionality)
  @All('execute/:path(*)')
  @ApiOperation({ summary: 'Handle webhook execution (dynamic endpoint)' })
  @ApiResponse({ status: 200, description: 'Webhook executed successfully' })
  @ApiParam({ name: 'path', type: 'string', description: 'Webhook path' })
  async handleWebhook(
    @Param('path') path: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const result = await this.webhooksService.executeWebhook(
      path,
      req.method,
      req.body,
      req.headers,
      req.query,
    );

    res.status(result.statusCode).json(result.data);
  }

  @Get('test/:id')
  @ApiOperation({ summary: 'Test webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook test completed' })
  @ApiParam({ name: 'id', type: 'string' })
  async testWebhook(@Param('id') id: string) {
    return this.webhooksService.testWebhook(id);
  }
}
