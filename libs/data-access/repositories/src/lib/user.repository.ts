import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { User, UserSession } from '@flowforge/core/entities';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserSession)
    private readonly userSessionRepository: Repository<UserSession>,
  ) {}

  async create(createUserData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    organizationId: string;
  }): Promise<User> {
    const saltRounds = parseInt(process.env.HASH_ROUNDS || '12', 10);
    const passwordHash = await bcrypt.hash(createUserData.password, saltRounds);

    const user = this.userRepository.create({
      ...createUserData,
      passwordHash,
    });

    return this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['organization'],
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['organization'],
    });
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const saltRounds = parseInt(process.env.HASH_ROUNDS || '12', 10);
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    await this.userRepository.update(userId, { passwordHash });
  }

  async createSession(
    userId: string,
    refreshToken: string,
    expiresAt: Date,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<UserSession> {
    const session = this.userSessionRepository.create({
      userId,
      refreshToken,
      expiresAt,
      ipAddress,
      userAgent,
    });

    return this.userSessionRepository.save(session);
  }

  async findSessionByToken(refreshToken: string): Promise<UserSession | null> {
    return this.userSessionRepository.findOne({
      where: { refreshToken, isActive: true },
      relations: ['user'],
    });
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.userSessionRepository.update(sessionId, { isActive: false });
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.userSessionRepository.update(
      { userId, isActive: true },
      { isActive: false },
    );
  }

  async cleanupExpiredSessions(): Promise<void> {
    await this.userSessionRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }
}
