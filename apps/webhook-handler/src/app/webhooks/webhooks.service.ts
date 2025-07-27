import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { Workflow } from '@flowforge/core/entities';

// Import webhook entity if it exists, otherwise define interface
interface Webhook {
  id: string;
  workflowId: string;
  nodeId: string;
  path: string;
  method: string;
  responseMode: 'onReceived' | 'lastNode';
  responseCode: number;
  responseData?: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);
  private readonly webhookStore = new Map<string, Webhook>(); // In-memory store for now

  constructor(
    @InjectRepository(Workflow)
    private readonly workflowRepository: Repository<Workflow>,
    private readonly httpService: HttpService,
  ) {}

  async createWebhook(webhookConfig: Partial<Webhook>): Promise<Webhook> {
    this.logger.log(`Creating webhook for workflow ${webhookConfig.workflowId}`);

    // Validate workflow exists
    const workflow = await this.workflowRepository.findOne({
      where: { id: webhookConfig.workflowId },
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${webhookConfig.workflowId} not found`);
    }

    // Generate unique webhook ID and path
    const webhookId = this.generateWebhookId();
    const webhookPath = webhookConfig.path || `/webhook/${webhookId}`;

    // Check if path already exists
    const existingWebhook = Array.from(this.webhookStore.values()).find(
      w => w.path === webhookPath && w.isActive
    );

    if (existingWebhook) {
      throw new BadRequestException(`Webhook path ${webhookPath} already exists`);
    }

    const webhook: Webhook = {
      id: webhookId,
      workflowId: webhookConfig.workflowId,
      nodeId: webhookConfig.nodeId || 'webhook-trigger',
      path: webhookPath,
      method: webhookConfig.method || 'POST',
      responseMode: webhookConfig.responseMode || 'onReceived',
      responseCode: webhookConfig.responseCode || 200,
      responseData: webhookConfig.responseData || { message: 'Webhook received' },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.webhookStore.set(webhookId, webhook);

    this.logger.log(`Webhook created successfully: ${webhookId} -> ${webhookPath}`);
    return webhook;
  }

  async listWebhooks(workflowId?: string): Promise<Webhook[]> {
    let webhooks = Array.from(this.webhookStore.values());

    if (workflowId) {
      webhooks = webhooks.filter(webhook => webhook.workflowId === workflowId);
    }

    return webhooks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getWebhook(id: string): Promise<Webhook> {
    const webhook = this.webhookStore.get(id);
    
    if (!webhook) {
      throw new NotFoundException(`Webhook with ID ${id} not found`);
    }

    return webhook;
  }

  async updateWebhook(id: string, updates: Partial<Webhook>): Promise<Webhook> {
    const webhook = await this.getWebhook(id);

    // Update webhook properties
    const updatedWebhook: Webhook = {
      ...webhook,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date(),
    };

    this.webhookStore.set(id, updatedWebhook);

    this.logger.log(`Webhook updated: ${id}`);
    return updatedWebhook;
  }

  async deleteWebhook(id: string): Promise<void> {
    const webhook = await this.getWebhook(id);
    
    this.webhookStore.delete(id);
    
    this.logger.log(`Webhook deleted: ${id}`);
  }

  async activateWebhook(id: string): Promise<Webhook> {
    return this.updateWebhook(id, { isActive: true });
  }

  async deactivateWebhook(id: string): Promise<Webhook> {
    return this.updateWebhook(id, { isActive: false });
  }

  async executeWebhook(
    path: string,
    method: string,
    body: any,
    headers: Record<string, any>,
    queryParams: Record<string, any>,
  ): Promise<{ statusCode: number; data: any }> {
    this.logger.log(`Executing webhook: ${method} ${path}`);

    // Find webhook by path and method
    const webhook = Array.from(this.webhookStore.values()).find(
      w => w.path === path && w.method.toLowerCase() === method.toLowerCase() && w.isActive
    );

    if (!webhook) {
      this.logger.warn(`Webhook not found: ${method} ${path}`);
      return {
        statusCode: 404,
        data: { error: 'Webhook not found' },
      };
    }

    try {
      // Prepare webhook data
      const webhookData = {
        method,
        path,
        headers: this.sanitizeHeaders(headers),
        body,
        query: queryParams,
        timestamp: new Date().toISOString(),
      };

      // Execute workflow via workflow engine
      await this.triggerWorkflowExecution(webhook, webhookData);

      // Return response based on webhook configuration
      const responseData = webhook.responseData || { message: 'Webhook executed successfully' };
      
      return {
        statusCode: webhook.responseCode || 200,
        data: {
          success: true,
          ...responseData,
          executionId: this.generateExecutionId(),
        },
      };

    } catch (error) {
      this.logger.error(`Webhook execution failed: ${path}`, error);
      
      return {
        statusCode: 500,
        data: {
          success: false,
          error: 'Webhook execution failed',
          message: error.message,
        },
      };
    }
  }

  async testWebhook(id: string): Promise<any> {
    const webhook = await this.getWebhook(id);

    // Send test payload to webhook
    const testPayload = {
      test: true,
      timestamp: new Date().toISOString(),
      message: 'This is a test webhook execution',
    };

    return this.executeWebhook(
      webhook.path,
      webhook.method,
      testPayload,
      { 'content-type': 'application/json' },
      {},
    );
  }

  private async triggerWorkflowExecution(webhook: Webhook, webhookData: any): Promise<void> {
    try {
      // In a real implementation, this would call the workflow engine
      // For now, we'll just log the execution
      this.logger.log(`Triggering workflow execution: ${webhook.workflowId} via node ${webhook.nodeId}`);
      
      // TODO: Call workflow engine API
      // await this.httpService.post('workflow-engine/workflow-execution/webhook', {
      //   workflowId: webhook.workflowId,
      //   nodeId: webhook.nodeId,
      //   data: webhookData,
      // }).toPromise();

    } catch (error) {
      this.logger.error(`Failed to trigger workflow execution for webhook ${webhook.id}`, error);
      throw error;
    }
  }

  private sanitizeHeaders(headers: Record<string, any>): Record<string, any> {
    const sanitized = { ...headers };
    
    // Remove sensitive headers
    delete sanitized.authorization;
    delete sanitized.cookie;
    delete sanitized['x-api-key'];
    
    return sanitized;
  }

  private generateWebhookId(): string {
    return `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getWebhookStats(webhookId: string): Promise<any> {
    const webhook = await this.getWebhook(webhookId);
    
    // In a real implementation, this would query execution statistics
    return {
      webhookId,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      lastExecution: null,
      averageExecutionTime: 0,
      isActive: webhook.isActive,
    };
  }

  // Method to get webhook by path (used internally)
  async getWebhookByPath(path: string, method: string): Promise<Webhook | null> {
    const webhook = Array.from(this.webhookStore.values()).find(
      w => w.path === path && w.method.toLowerCase() === method.toLowerCase() && w.isActive
    );
    
    return webhook || null;
  }

  // Method to get all webhooks for a workflow
  async getWorkflowWebhooks(workflowId: string): Promise<Webhook[]> {
    return Array.from(this.webhookStore.values()).filter(
      webhook => webhook.workflowId === workflowId
    );
  }

  // Method to deactivate all webhooks for a workflow
  async deactivateWorkflowWebhooks(workflowId: string): Promise<void> {
    const webhooks = await this.getWorkflowWebhooks(workflowId);
    
    for (const webhook of webhooks) {
      await this.deactivateWebhook(webhook.id);
    }
    
    this.logger.log(`Deactivated ${webhooks.length} webhooks for workflow ${workflowId}`);
  }
}
