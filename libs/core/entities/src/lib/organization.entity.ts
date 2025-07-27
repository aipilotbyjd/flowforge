import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Workflow } from './workflow.entity';
import { WorkflowExecution } from './workflow-execution.entity';
import { Credential } from './credential.entity';
import { WorkflowTag } from './workflow-tag.entity';
import { ApiKey } from './api-key.entity';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @OneToMany(() => User, user => user.organization)
  users: User[];

  @OneToMany(() => Workflow, workflow => workflow.organization)
  workflows: Workflow[];

  @OneToMany(() => Credential, credential => credential.organization)
  credentials: Credential[];

  @OneToMany(() => WorkflowTag, tag => tag.organization)
  tags: WorkflowTag[];

  @OneToMany(() => ApiKey, apiKey => apiKey.organization)
  apiKeys: ApiKey[];

  @OneToMany(() => WorkflowExecution, execution => execution.organization)
  workflowExecutions: WorkflowExecution[];
}
