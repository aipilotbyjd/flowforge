import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Organization } from './organization.entity';
import { WorkflowExecution } from './workflow-execution.entity';
import { Schedule } from './schedule.entity';
import { Webhook } from './webhook.entity';

@Entity('workflows')
export class Workflow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', default: [] })
  nodes: Record<string, any>[];

  @Column({ type: 'jsonb', default: [] })
  connections: Record<string, any>[];

  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, any>;

  @Column({ type: 'text', array: true, default: [] })
  tags: string[];

  @Column({ type: 'boolean', default: false })
  isActive: boolean;

  @Column({ type: 'int', default: 1 })
  versionId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Organization, organization => organization.workflows)
  organization: Organization;

  @OneToMany(() => WorkflowExecution, execution => execution.workflow)
  executions: WorkflowExecution[];

  @OneToMany(() => Schedule, schedule => schedule.workflow)
  schedules: Schedule[];

  @OneToMany(() => Webhook, webhook => webhook.workflow)
  webhooks: Webhook[];
}
