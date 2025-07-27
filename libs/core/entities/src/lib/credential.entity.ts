import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, Index } from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';

export enum CredentialType {
  API_KEY = 'api_key',
  OAUTH2 = 'oauth2',
  BASIC_AUTH = 'basic_auth',
  JWT = 'jwt',
  DATABASE = 'database',
  EMAIL = 'email',
  SSH_KEY = 'ssh_key',
  CUSTOM = 'custom'
}

@Entity('credentials')
@Index(['organizationId', 'type'])
@Index(['name', 'organizationId'])
export class Credential {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: CredentialType })
  type: CredentialType;

  @Column({ type: 'text', name: 'encrypted_data' })
  encryptedData: string;

  @Column({ type: 'varchar', length: 255, name: 'encryption_key_id' })
  encryptionKeyId: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'expires_at' })
  expiresAt?: Date;

  @Column({ type: 'uuid', name: 'organization_id' })
  organizationId: string;

  @Column({ type: 'uuid', name: 'created_by' })
  createdById: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Organization, organization => organization.credentials)
  organization: Organization;

  @ManyToOne(() => User, user => user.credentialsCreated)
  createdBy: User;

  // Virtual properties
  get isExpired(): boolean {
    return this.expiresAt ? new Date() > this.expiresAt : false;
  }

  get isValid(): boolean {
    return this.isActive && !this.isExpired;
  }
}
