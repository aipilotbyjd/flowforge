import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, Index } from 'typeorm';
import { User } from './user.entity';

@Entity('user_sessions')
@Index(['userId', 'isActive'])
@Index(['refreshToken'])
@Index(['expiresAt'])
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 500, name: 'refresh_token', unique: true })
  refreshToken: string;

  @Column({ type: 'varchar', length: 45, name: 'ip_address', nullable: true })
  ipAddress?: string;

  @Column({ type: 'text', name: 'user_agent', nullable: true })
  userAgent?: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'last_used_at' })
  lastUsedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, user => user.sessions)
  user: User;

  // Virtual properties
  get isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  get isValid(): boolean {
    return this.isActive && !this.isExpired;
  }
}
