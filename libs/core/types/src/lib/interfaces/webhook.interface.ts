export interface WebhookEntity {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  workflowId: string;
  isActive: boolean;
  secret?: string;
  headers?: Record<string, string>;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastTriggeredAt?: Date;
}

export interface WebhookExecution {
  id: string;
  webhookId: string;
  workflowId: string;
  executionId: string;
  method: string;
  headers: Record<string, string>;
  body: any;
  query: Record<string, string>;
  ipAddress: string;
  userAgent?: string;
  success: boolean;
  error?: string;
  responseTime: number;
  createdAt: Date;
}

export interface CreateWebhookRequest {
  name: string;
  workflowId: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  secret?: string;
}

export interface UpdateWebhookRequest {
  name?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  secret?: string;
  isActive?: boolean;
}

export interface WebhookTestResult {
  success: boolean;
  statusCode: number;
  responseTime: number;
  headers: Record<string, string>;
  body: any;
  error?: string;
}
