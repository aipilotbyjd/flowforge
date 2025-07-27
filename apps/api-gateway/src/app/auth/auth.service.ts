import { Injectable, InternalServerErrorException, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository, OrganizationRepository } from '@flowforge/data-access/repositories';
import { User, UserRole } from '@flowforge/core/entities';

interface LoginDto {
  email: string;
  password: string;
}

interface RegisterDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  organizationName?: string;
}

interface RefreshTokenDto {
  refreshToken: string;
}

interface ForgotPasswordDto {
  email: string;
}

interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

interface VerifyEmailDto {
  token: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async register(registerDto: RegisterDto) {
    try {
      const { email, password, firstName, lastName, organizationName } = registerDto;

      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        throw new BadRequestException('User with this email already exists');
      }

      // Create organization first (required for user creation)
      const orgName = organizationName || `${firstName || email.split('@')[0]}'s Organization`;
      const orgSlug = await this.organizationRepository.generateUniqueSlug(orgName);
      
      const organization = await this.organizationRepository.create({
        name: orgName,
        slug: orgSlug,
        settings: {}
      });

      // Create user with admin role for their organization
      const user = await this.userRepository.create({
        email,
        password,
        firstName,
        lastName,
        organizationId: organization.id
      });

      // Generate tokens
      const tokenPayload = {
        sub: user.id,
        email: user.email,
        role: UserRole.ADMIN,
        organizationId: organization.id
      };

      const accessToken = this.generateAccessToken(tokenPayload);
      const refreshToken = this.generateRefreshToken(tokenPayload);

      // Create session
      const refreshTokenExpiry = new Date();
      refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days
      
      await this.userRepository.createSession(
        user.id,
        refreshToken,
        refreshTokenExpiry
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: UserRole.ADMIN,
          organizationId: organization.id
        },
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 900 // 15 minutes in seconds
        }
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to register user');
    }
  }

  async login(loginDto: LoginDto) {
    try {
      const { email, password } = loginDto;

      // Find user by email
      const user = await this.userRepository.findByEmail(email);

      if (!user || !(await this.userRepository.validatePassword(user, password))) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // Generate tokens
      const tokenPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organization.id
      };

      const accessToken = this.generateAccessToken(tokenPayload);
      const refreshToken = this.generateRefreshToken(tokenPayload);

      // Create or update session
      const refreshTokenExpiry = new Date();
      refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

      await this.userRepository.revokeAllUserSessions(user.id); // ensure single session

      await this.userRepository.createSession(
        user.id,
        refreshToken,
        refreshTokenExpiry
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          organizationId: user.organization.id
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 900 // 15 minutes in seconds
        }
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    try {
      // Implementation will be added when repositories are ready
      throw new InternalServerErrorException('Refresh token service not implemented yet');
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    try {
      // Implementation will be added when repositories are ready
      throw new InternalServerErrorException('Forgot password service not implemented yet');
    } catch (error) {
      throw new BadRequestException('Failed to process forgot password request');
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    try {
      // Implementation will be added when repositories are ready
      throw new InternalServerErrorException('Reset password service not implemented yet');
    } catch (error) {
      throw new BadRequestException('Failed to reset password');
    }
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    try {
      // Implementation will be added when repositories are ready
      throw new InternalServerErrorException('Email verification service not implemented yet');
    } catch (error) {
      throw new BadRequestException('Failed to verify email');
    }
  }

  async resendVerificationEmail(email: string) {
    try {
      // Implementation will be added when repositories are ready
      throw new InternalServerErrorException('Resend verification service not implemented yet');
    } catch (error) {
      throw new BadRequestException('Failed to resend verification email');
    }
  }

  async logout(userId: string) {
    try {
      // Revoke all sessions for the user
      await this.userRepository.revokeAllUserSessions(userId);
      return { message: 'Logged out successfully' };
    } catch (error) {
      throw new InternalServerErrorException('Failed to logout');
    }
  }

  async getProfile(userId: string) {
    try {
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new NotFoundException('User not found');
      }

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organization.id,
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          slug: user.organization.slug
        },
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Failed to get user profile');
    }
  }

  private generateAccessToken(payload: any): string {
    return this.jwtService.sign(payload);
  }

  private generateRefreshToken(payload: any): string {
    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });
  }
}
