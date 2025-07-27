import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, Index } from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';

export enum ApiKeyScope {
  FULL_ACCESS = 'full_access',
  WORKFLOWS_READ = 'workflows_read',
  WORKFLOWS_WRITE = 'workflows_write',
  EXECUTIONS_READ = 'executions_read',
  EXECUTIONS_WRITE = 'executions_write',
  WEBHOOKS_ACCESS = 'webhooks_access',
  CREDENTIALS_READ = 'credentials_read',
  CREDENTIALS_WRITE = 'credentials_write'
}

@Entity('api_keys')
@Index(['organizationId', 'isActive'])
@Index(['keyHash'])
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 255, name: 'key_hash', unique: true })
  keyHash: string;

  @Column({ type: 'varchar', length: 20, name: 'key_prefix' })
  keyPrefix: string;

  @Column({ type: 'simple-array', default: '' })
  scopes: ApiKeyScope[];

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'expires_at' })
  expiresAt?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'last_used_at' })
  lastUsedAt?: Date;

  @Column({ type: 'varchar', length: 45, nullable: true, name: 'last_used_ip' })
  lastUsedIp?: string;

  @Column({ type: 'integer', default: 0, name: 'usage_count' })
  usageCount: number;

  @Column({ type: 'uuid', name: 'organization_id' })
  organizationId: string;

  @Column({ type: 'uuid', name: 'created_by' })
  createdById: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Organization, organization => organization.apiKeys)
  organization: Organization;

  @ManyToOne(() => User, user => user.apiKeysCreated)
  createdBy: User;

  // Virtual properties
  get isExpired(): boolean {
    return this.expiresAt ? new Date() > this.expiresAt : false;
  }

  get isValid(): boolean {
    return this.isActive && !this.isExpired;
  }

  hasScope(scope: ApiKeyScope): boolean {
    return this.scopes.includes(scope) || this.scopes.includes(ApiKeyScope.FULL_ACCESS);
  }

  // Methods
  updateUsage(ipAddress?: string): void {
    this.usageCount += 1;
    this.lastUsedAt = new Date();
    if (ipAddress) {
      this.lastUsedIp = ipAddress;
    }
  }
}
