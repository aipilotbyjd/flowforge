import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Workflow } from './workflow.entity';
import { User } from './user.entity';
import { Organization } from './organization.entity';

export enum WebhookMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
}

export enum WebhookResponseMode {
  ON_RECEIVED = 'onReceived',
  LAST_NODE = 'lastNode',
  RESPONSE_NODE = 'responseNode',
  NO_RESPONSE = 'noResponse',
}

export enum WebhookAuthType {
  NONE = 'none',
  BASIC_AUTH = 'basicAuth',
  HEADER_AUTH = 'headerAuth',
  QUERY_AUTH = 'queryAuth',
  JWT = 'jwt',
}

@Entity('webhooks')
@Index(['path', 'method'], { unique: true })
@Index(['workflowId'])
@Index(['organizationId'])
@Index(['isActive'])
export class Webhook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workflow_id' })
  workflowId: string;

  @ManyToOne(() => Workflow, workflow => workflow.webhooks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflow_id' })
  workflow: Workflow;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'created_by' })
  createdBy: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'created_by' })
  createdByUser: User;

  @Column({ name: 'node_id', comment: 'The ID of the webhook trigger node' })
  nodeId: string;

  @Column({ length: 500, unique: true, comment: 'URL path for the webhook' })
  path: string;

  @Column({
    type: 'enum',
    enum: WebhookMethod,
    default: WebhookMethod.POST,
  })
  method: WebhookMethod;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({
    type: 'enum',
    enum: WebhookResponseMode,
    default: WebhookResponseMode.ON_RECEIVED,
    name: 'response_mode',
  })
  responseMode: WebhookResponseMode;

  @Column({ name: 'response_code', type: 'integer', default: 200 })
  responseCode: number;

  @Column({ name: 'response_data', type: 'jsonb', nullable: true })
  responseData: any;

  @Column({ name: 'response_headers', type: 'jsonb', nullable: true })
  responseHeaders: Record<string, string>;

  @Column({
    type: 'enum',
    enum: WebhookAuthType,
    default: WebhookAuthType.NONE,
    name: 'auth_type',
  })
  authType: WebhookAuthType;

  @Column({ name: 'auth_config', type: 'jsonb', nullable: true })
  authConfig: {
    // Basic Auth
    username?: string;
    password?: string;
    
    // Header Auth
    headerName?: string;
    headerValue?: string;
    
    // Query Auth
    paramName?: string;
    paramValue?: string;
    
    // JWT
    secret?: string;
    algorithm?: string;
    issuer?: string;
    audience?: string;
    
    [key: string]: any;
  };

  @Column({ type: 'jsonb', nullable: true, comment: 'Webhook configuration and options' })
  options: {
    binary?: boolean;
    rawBody?: boolean;
    ignoreSsl?: boolean;
    timeout?: number;
    maxPayloadSize?: number;
    enableCors?: boolean;
    corsOrigins?: string[];
    rateLimit?: {
      windowMs: number;
      max: number;
    };
    [key: string]: any;
  };

  @Column({ name: 'execution_count', type: 'integer', default: 0 })
  executionCount: number;

  @Column({ name: 'success_count', type: 'integer', default: 0 })
  successCount: number;

  @Column({ name: 'error_count', type: 'integer', default: 0 })
  errorCount: number;

  @Column({ name: 'last_execution_at', type: 'timestamp', nullable: true })
  lastExecutionAt: Date;

  @Column({ name: 'last_success_at', type: 'timestamp', nullable: true })
  lastSuccessAt: Date;

  @Column({ name: 'last_error_at', type: 'timestamp', nullable: true })
  lastErrorAt: Date;

  @Column({ name: 'last_error_message', type: 'text', nullable: true })
  lastErrorMessage: string;

  @Column({ name: 'average_response_time', type: 'float', nullable: true, comment: 'Average response time in milliseconds' })
  averageResponseTime: number;

  @Column({ type: 'jsonb', nullable: true, comment: 'Webhook metadata and tags' })
  metadata: {
    description?: string;
    tags?: string[];
    notes?: string;
    version?: string;
    [key: string]: any;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Computed properties
  get fullUrl(): string {
    // This would be computed based on the base webhook URL
    return `/webhook${this.path}`;
  }

  get successRate(): number {
    if (this.executionCount === 0) return 0;
    return (this.successCount / this.executionCount) * 100;
  }

  get errorRate(): number {
    if (this.executionCount === 0) return 0;
    return (this.errorCount / this.executionCount) * 100;
  }

  get hasAuth(): boolean {
    return this.authType !== WebhookAuthType.NONE;
  }

  get isHealthy(): boolean {
    // Consider webhook healthy if success rate > 95% and last execution was successful
    return this.successRate > 95 && this.lastSuccessAt > this.lastErrorAt;
  }

  get status(): 'active' | 'inactive' | 'error' | 'warning' {
    if (!this.isActive) return 'inactive';
    if (this.errorRate > 50) return 'error';
    if (this.errorRate > 20) return 'warning';
    return 'active';
  }
}
