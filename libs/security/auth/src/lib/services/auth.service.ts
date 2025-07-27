import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserSession, Organization } from '@flowforge/core/entities';
import { LoginDto, RegisterDto } from '@flowforge/core/types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserSession)
    private readonly sessionRepository: Repository<UserSession>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ user: User; tokens: any }> {
    const { email, password, firstName, lastName, organizationName } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create or find organization
    let organization: Organization;
    if (organizationName) {
      organization = await this.organizationRepository.findOne({
        where: { name: organizationName },
      });
      
      if (!organization) {
        organization = this.organizationRepository.create({
          name: organizationName,
          slug: organizationName.toLowerCase().replace(/\s+/g, '-'),
          settings: { features: ['workflows', 'webhooks', 'schedules'] },
        });
        organization = await this.organizationRepository.save(organization);
      }
    } else {
      // Use default organization
      organization = await this.organizationRepository.findOne({
        where: { slug: 'default' },
      });
    }

    // Create user
    const user = this.userRepository.create({
      email,
      passwordHash: hashedPassword,
      firstName,
      lastName,
      role: 'user',
      isActive: true,
      emailVerified: false,
      organization,
    });

    const savedUser = await this.userRepository.save(user);
    
    // Generate tokens
    const tokens = await this.generateTokens(savedUser);
    
    // Create session
    await this.createSession(savedUser.id, tokens.refreshToken);

    this.logger.log(`User registered successfully: ${savedUser.email}`);
    
    return {
      user: this.sanitizeUser(savedUser),
      tokens,
    };
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<{ user: User; tokens: any }> {
    const { email, password } = loginDto;

    // Find user with organization
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['organization'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

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
    
    // Create session
    await this.createSession(user.id, tokens.refreshToken, ipAddress, userAgent);

    this.logger.log(`User logged in successfully: ${user.email}`);
    
    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async refreshTokens(refreshToken: string): Promise<{ tokens: any }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      // Find session
      const session = await this.sessionRepository.findOne({
        where: { refreshToken, isActive: true, userId: payload.sub },
        relations: ['user'],
      });

      if (!session || session.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(session.user);
      
      // Update session
      session.refreshToken = tokens.refreshToken;
      session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await this.sessionRepository.save(session);

      return { tokens };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateUser(payload: any): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      relations: ['organization'],
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }

  private async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organization?.id,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async createSession(
    userId: string,
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<UserSession> {
    const session = this.sessionRepository.create({
      userId,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: true,
      ipAddress,
      userAgent,
    });

    return await this.sessionRepository.save(session);
  }

  private sanitizeUser(user: User): Partial<User> {
    const { passwordHash, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}

