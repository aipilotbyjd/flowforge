import { Injectable, Logger, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { WorkflowExecution } from '@flowforge/core-entities';

export interface WebhookRegistration {
  id: string;
  workflowId: string;
  nodeId: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  isActive: boolean;
  responseMode: 'onReceived' | 'lastNode' | 'responseNode';
  responseCode: number;
  responseData?: any;
  webhookId?: string;
  authentication?: {
    type: 'none' | 'basicAuth' | 'headerAuth' | 'queryAuth';
    config?: any;
  };
  options?: {
    binary?: boolean;
    rawBody?: boolean;
    ignoreSsl?: boolean;
    timeout?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookExecution {
  webhookId: string;
  workflowId: string;
  executionId: string;
  method: string;
  path: string;
  headers: Record<string, string>;
  query: Record<string, any>;
  body: any;
  ip: string;
  userAgent?: string;
  timestamp: Date;
  responseStatus?: number;
  responseData?: any;
  processingTime?: number;
}

@Injectable()
export class WebhookManagementService {
  private readonly logger = new Logger(WebhookManagementService.name);
  private readonly registeredWebhooks = new Map<string, WebhookRegistration>();
  private readonly pathToWebhookMap = new Map<string, string>(); // path-method -> webhookId
  private readonly webhookExecutions = new Map<string, WebhookExecution[]>();

  constructor(
    @InjectRepository(WorkflowExecution)
    private readonly executionRepository: Repository<WorkflowExecution>,
  ) {
    this.loadWebhooksFromDatabase();
  }

  /**
   * Register a new webhook
   */
  async registerWebhook(registration: Partial<WebhookRegistration>): Promise<WebhookRegistration> {
    // Generate unique webhook ID if not provided
    const webhookId = registration.id || this.generateWebhookId();
    
    // Generate path if not provided
    let path = registration.path;
    if (!path) {
      path = `/webhook/${webhookId}`;
    }
    
    // Ensure path starts with /
    if (!path.startsWith('/')) {
      path = `/${path}`;
    }

    const method = registration.method || 'POST';
    const pathKey = `${path}-${method}`;

    // Check if path-method combination already exists
    if (this.pathToWebhookMap.has(pathKey)) {
      throw new ConflictException(`Webhook already exists for path: ${path} with method: ${method}`);
    }

    const webhook: WebhookRegistration = {
      id: webhookId,
      workflowId: registration.workflowId!,
      nodeId: registration.nodeId!,
      path,
      method,
      isActive: registration.isActive ?? true,
      responseMode: registration.responseMode || 'onReceived',
      responseCode: registration.responseCode || 200,
      responseData: registration.responseData,
      webhookId,
      authentication: registration.authentication || { type: 'none' },
      options: registration.options || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store in memory
    this.registeredWebhooks.set(webhookId, webhook);
    this.pathToWebhookMap.set(pathKey, webhookId);

    // TODO: Store in database
    await this.saveWebhookToDatabase(webhook);

    this.logger.log(`Registered webhook: ${webhookId} at path: ${path} for workflow: ${webhook.workflowId}`);
    return webhook;
  }

  /**
   * Update an existing webhook
   */
  async updateWebhook(webhookId: string, updates: Partial<WebhookRegistration>): Promise<WebhookRegistration> {
    const existing = this.registeredWebhooks.get(webhookId);
    if (!existing) {
      throw new NotFoundException(`Webhook not found: ${webhookId}`);
    }

    // If path or method is being updated, check for conflicts
    if (updates.path || updates.method) {
      const newPath = updates.path || existing.path;
      const newMethod = updates.method || existing.method;
      const newPathKey = `${newPath}-${newMethod}`;
      const existingPathKey = `${existing.path}-${existing.method}`;

      if (newPathKey !== existingPathKey && this.pathToWebhookMap.has(newPathKey)) {
        throw new ConflictException(`Webhook already exists for path: ${newPath} with method: ${newMethod}`);
      }

      // Update path mapping
      this.pathToWebhookMap.delete(existingPathKey);
      this.pathToWebhookMap.set(newPathKey, webhookId);
    }

    const updatedWebhook: WebhookRegistration = {
      ...existing,
      ...updates,
      id: webhookId, // Ensure ID doesn't change
      updatedAt: new Date(),
    };

    this.registeredWebhooks.set(webhookId, updatedWebhook);
    
    // TODO: Update in database
    await this.saveWebhookToDatabase(updatedWebhook);

    this.logger.log(`Updated webhook: ${webhookId}`);
    return updatedWebhook;
  }

  /**
   * Unregister a webhook
   */
  async unregisterWebhook(webhookId: string): Promise<void> {
    const webhook = this.registeredWebhooks.get(webhookId);
    if (!webhook) {
      throw new NotFoundException(`Webhook not found: ${webhookId}`);
    }

    const pathKey = `${webhook.path}-${webhook.method}`;
    
    this.registeredWebhooks.delete(webhookId);
    this.pathToWebhookMap.delete(pathKey);
    this.webhookExecutions.delete(webhookId);

    // TODO: Remove from database
    await this.removeWebhookFromDatabase(webhookId);

    this.logger.log(`Unregistered webhook: ${webhookId}`);
  }

  /**
   * Get webhook by ID
   */
  getWebhook(webhookId: string): WebhookRegistration | null {
    return this.registeredWebhooks.get(webhookId) || null;
  }

  /**
   * Get webhook by path and method
   */
  getWebhookByPath(path: string, method: string): WebhookRegistration | null {
    const pathKey = `${path}-${method.toUpperCase()}`;
    const webhookId = this.pathToWebhookMap.get(pathKey);
    return webhookId ? this.registeredWebhooks.get(webhookId) || null : null;
  }

  /**
   * Get all webhooks for a workflow
   */
  getWebhooksByWorkflow(workflowId: string): WebhookRegistration[] {
    return Array.from(this.registeredWebhooks.values())
      .filter(webhook => webhook.workflowId === workflowId);
  }

  /**
   * Get all registered webhooks
   */
  getAllWebhooks(): WebhookRegistration[] {
    return Array.from(this.registeredWebhooks.values());
  }

  /**
   * Get active webhooks only
   */
  getActiveWebhooks(): WebhookRegistration[] {
    return Array.from(this.registeredWebhooks.values())
      .filter(webhook => webhook.isActive);
  }

  /**
   * Enable/disable a webhook
   */
  async toggleWebhook(webhookId: string, isActive: boolean): Promise<WebhookRegistration> {
    return this.updateWebhook(webhookId, { isActive });
  }

  /**
   * Record webhook execution
   */
  recordWebhookExecution(execution: WebhookExecution): void {
    if (!this.webhookExecutions.has(execution.webhookId)) {
      this.webhookExecutions.set(execution.webhookId, []);
    }

    const executions = this.webhookExecutions.get(execution.webhookId)!;
    executions.push(execution);

    // Keep only last 100 executions per webhook
    if (executions.length > 100) {
      executions.splice(0, executions.length - 100);
    }

    this.logger.debug(`Recorded execution for webhook: ${execution.webhookId}`);
  }

  /**
   * Get webhook execution history
   */
  getWebhookExecutions(webhookId: string, limit = 50): WebhookExecution[] {
    const executions = this.webhookExecutions.get(webhookId) || [];
    return executions.slice(-limit).reverse(); // Most recent first
  }

  /**
   * Validate webhook authentication
   */
  validateWebhookAuth(webhook: WebhookRegistration, headers: Record<string, string>, query: Record<string, any>): boolean {
    if (!webhook.authentication || webhook.authentication.type === 'none') {
      return true;
    }

    const { type, config } = webhook.authentication;

    switch (type) {
      case 'basicAuth':
        return this.validateBasicAuth(headers, config);
      case 'headerAuth':
        return this.validateHeaderAuth(headers, config);
      case 'queryAuth':
        return this.validateQueryAuth(query, config);
      default:
        this.logger.warn(`Unknown authentication type: ${type}`);
        return false;
    }
  }

  /**
   * Generate webhook statistics
   */
  getWebhookStats(webhookId: string): {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageResponseTime: number;
    lastExecution?: Date;
  } {
    const executions = this.webhookExecutions.get(webhookId) || [];
    
    const successful = executions.filter(e => e.responseStatus && e.responseStatus < 400);
    const failed = executions.filter(e => e.responseStatus && e.responseStatus >= 400);
    
    const totalResponseTime = executions
      .filter(e => e.processingTime)
      .reduce((sum, e) => sum + (e.processingTime || 0), 0);
    
    const averageResponseTime = executions.length > 0 ? totalResponseTime / executions.length : 0;
    
    return {
      totalExecutions: executions.length,
      successfulExecutions: successful.length,
      failedExecutions: failed.length,
      averageResponseTime,
      lastExecution: executions.length > 0 ? executions[executions.length - 1].timestamp : undefined,
    };
  }

  /**
   * Clean up old webhook executions
   */
  cleanupOldExecutions(olderThanDays = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    let cleanedCount = 0;
    
    for (const [webhookId, executions] of this.webhookExecutions.entries()) {
      const initialLength = executions.length;
      const filtered = executions.filter(e => e.timestamp > cutoffDate);
      
      if (filtered.length < initialLength) {
        this.webhookExecutions.set(webhookId, filtered);
        cleanedCount += (initialLength - filtered.length);
      }
    }
    
    this.logger.log(`Cleaned up ${cleanedCount} old webhook executions`);
    return cleanedCount;
  }

  // Private methods

  private generateWebhookId(): string {
    return randomBytes(16).toString('hex');
  }

  private validateBasicAuth(headers: Record<string, string>, config: any): boolean {
    const authHeader = headers.authorization || headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return false;
    }

    const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
    const [username, password] = credentials.split(':');
    
    return username === config.username && password === config.password;
  }

  private validateHeaderAuth(headers: Record<string, string>, config: any): boolean {
    const headerValue = headers[config.headerName.toLowerCase()] || headers[config.headerName];
    return headerValue === config.headerValue;
  }

  private validateQueryAuth(query: Record<string, any>, config: any): boolean {
    return query[config.paramName] === config.paramValue;
  }

  private async loadWebhooksFromDatabase(): Promise<void> {
    // TODO: Load webhooks from database on startup
    this.logger.log('Loading webhooks from database...');
    // Implementation would go here
  }

  private async saveWebhookToDatabase(webhook: WebhookRegistration): Promise<void> {
    // TODO: Save webhook to database
    this.logger.debug(`Saving webhook ${webhook.id} to database`);
    // Implementation would go here
  }

  private async removeWebhookFromDatabase(webhookId: string): Promise<void> {
    // TODO: Remove webhook from database
    this.logger.debug(`Removing webhook ${webhookId} from database`);
    // Implementation would go here
  }
}
