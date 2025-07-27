import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export interface RegisterDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  organizationName?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
    organizationId: string;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  
  // In-memory storage for demo purposes
  private users = new Map<string, any>();
  private organizations = new Map<string, any>();
  private sessions = new Map<string, any>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.initializeDemoData();
  }

  private async initializeDemoData() {
    // Create default organization
    const defaultOrgId = uuidv4();
    this.organizations.set(defaultOrgId, {
      id: defaultOrgId,
      name: 'Default Organization',
      slug: 'default',
      settings: {},
      createdAt: new Date(),
    });

    // Create admin user
    const adminId = uuidv4();
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    this.users.set(adminId, {
      id: adminId,
      email: 'admin@flowforge.dev',
      passwordHash: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true,
      emailVerified: true,
      organizationId: defaultOrgId,
      createdAt: new Date(),
    });

    this.logger.log('Demo data initialized');
  }

  async register(registerDto: RegisterDto): Promise<AuthResult> {
    const { email, password, firstName, lastName, organizationName } = registerDto;

    // Check if user already exists
    const existingUser = Array.from(this.users.values()).find(u => u.email === email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Create organization if provided
    let organizationId: string;
    if (organizationName) {
      organizationId = uuidv4();
      this.organizations.set(organizationId, {
        id: organizationId,
        name: organizationName,
        slug: organizationName.toLowerCase().replace(/\s+/g, '-'),
        settings: {},
        createdAt: new Date(),
      });
    } else {
      // Use default organization
      organizationId = Array.from(this.organizations.values())[0].id;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const userId = uuidv4();
    const user = {
      id: userId,
      email,
      passwordHash: hashedPassword,
      firstName,
      lastName,
      role: organizationName ? 'admin' : 'user', // First user in new org is admin
      isActive: true,
      emailVerified: false,
      organizationId,
      createdAt: new Date(),
    };

    this.users.set(userId, user);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Store session
    this.storeSession(userId, tokens.refreshToken);

    this.logger.log(`User registered: ${email}`);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResult> {
    const { email, password } = loginDto;

    // Find user
    const user = Array.from(this.users.values()).find(u => u.email === email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Store session
    this.storeSession(user.id, tokens.refreshToken);

    this.logger.log(`User logged in: ${email}`);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
      },
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET') || this.configService.get('JWT_SECRET'),
      });

      const user = this.users.get(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if session exists
      const session = this.sessions.get(user.id);
      if (!session || session.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      // Update session
      this.storeSession(user.id, tokens.refreshToken);

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    this.sessions.delete(userId);
    this.logger.log(`User logged out: ${userId}`);
  }

  async getProfile(userId: string) {
    const user = this.users.get(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const organization = this.organizations.get(user.organizationId);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      },
      createdAt: user.createdAt,
    };
  }

  private async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET') || this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    return { accessToken, refreshToken };
  }

  private storeSession(userId: string, refreshToken: string) {
    this.sessions.set(userId, {
      userId,
      refreshToken,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
  }

  // Password reset functionality (basic implementation)
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = Array.from(this.users.values()).find(u => u.email === email);
    if (!user) {
      // Don't reveal if user exists
      return { message: 'If the email exists, a password reset link has been sent.' };
    }

    // In a real implementation, you would:
    // 1. Generate a secure reset token
    // 2. Store it with expiration
    // 3. Send email with reset link
    
    const resetToken = uuidv4();
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    this.logger.log(`Password reset requested for: ${email}`);

    return { message: 'If the email exists, a password reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const user = Array.from(this.users.values()).find(
      u => u.passwordResetToken === token && u.passwordResetExpires > new Date()
    );

    if (!user) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.passwordHash = hashedPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    // Invalidate all sessions
    this.sessions.delete(user.id);

    this.logger.log(`Password reset completed for user: ${user.id}`);

    return { message: 'Password has been reset successfully' };
  }

  // Utility methods for testing
  getAllUsers() {
    return Array.from(this.users.values()).map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      organizationId: user.organizationId,
    }));
  }

  getAllOrganizations() {
    return Array.from(this.organizations.values());
  }
}
