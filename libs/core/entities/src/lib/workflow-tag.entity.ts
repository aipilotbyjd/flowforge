import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, Index } from 'typeorm';
import { Organization } from './organization.entity';

@Entity('workflow_tags')
@Index(['organizationId', 'name'], { unique: true })
export class WorkflowTag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 7, default: '#1f77b4' })
  color: string;

  @Column({ type: 'uuid', name: 'organization_id' })
  organizationId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Organization, organization => organization.tags)
  organization: Organization;
}
