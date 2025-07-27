import {
  Controller,
  Post,
  Body,
  HttpStatus,
  UseGuards,
  Req,
  Get,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  LoginDto,
  RegisterDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  RefreshTokenDto,
} from './dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register new user',
    description: 'Creates a new user account and organization if needed'
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User registered successfully',
    schema: {
      example: {
        success: true,
        data: {
          user: {
            id: 'user_123',
            email: 'user@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'admin',
            organizationId: 'org_123'
          },
          organization: {
            id: 'org_123',
            name: 'Acme Corp',
            slug: 'acme-corp'
          },
          tokens: {
            accessToken: 'jwt-token-here',
            refreshToken: 'refresh-token-here',
            expiresIn: 3600
          }
        },
        message: 'User registered successfully'
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid registration data or email already exists'
  })
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    
    return {
      success: true,
      data: result,
      message: 'User registered successfully'
    };
  }

  @Post('login')
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticates user and returns JWT tokens'
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
    schema: {
      example: {
        success: true,
        data: {
          user: {
            id: 'user_123',
            email: 'user@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'admin',
            organizationId: 'org_123'
          },
          tokens: {
            accessToken: 'jwt-token-here',
            refreshToken: 'refresh-token-here',
            expiresIn: 3600
          }
        },
        message: 'Login successful'
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials'
  })
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    
    return {
      success: true,
      data: result,
      message: 'Login successful'
    };
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Generates new access token using refresh token'
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token refreshed successfully',
    schema: {
      example: {
        success: true,
        data: {
          accessToken: 'new-jwt-token-here',
          refreshToken: 'new-refresh-token-here',
          expiresIn: 3600
        },
        message: 'Token refreshed successfully'
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid refresh token'
  })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    const result = await this.authService.refreshToken(refreshTokenDto.refreshToken);
    
    return {
      success: true,
      data: result,
      message: 'Token refreshed successfully'
    };
  }

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Request password reset',
    description: 'Sends password reset email to user'
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset email sent',
    schema: {
      example: {
        success: true,
        message: 'Password reset email sent successfully'
      }
    }
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto.email);
    
    return {
      success: true,
      message: 'Password reset email sent successfully'
    };
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset password',
    description: 'Resets user password using reset token'
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset successful',
    schema: {
      example: {
        success: true,
        message: 'Password reset successful'
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired reset token'
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword
    );
    
    return {
      success: true,
      message: 'Password reset successful'
    };
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Change password',
    description: 'Changes user password (requires authentication)'
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password changed successfully'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid current password'
  })
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req: any
  ) {
    await this.authService.changePassword(
      req.user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword
    );
    
    return {
      success: true,
      message: 'Password changed successfully'
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Retrieves current user profile information'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          id: 'user_123',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'admin',
          organizationId: 'org_123',
          organization: {
            id: 'org_123',
            name: 'Acme Corp',
            slug: 'acme-corp'
          },
          isActive: true,
          emailVerified: true,
          lastLoginAt: '2024-01-01T12:00:00Z',
          createdAt: '2024-01-01T00:00:00Z'
        },
        message: 'Profile retrieved successfully'
      }
    }
  })
  async getProfile(@Req() req: any) {
    const profile = await this.authService.getProfile(req.user.id);
    
    return {
      success: true,
      data: profile,
      message: 'Profile retrieved successfully'
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'User logout',
    description: 'Invalidates user session and tokens'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logout successful'
  })
  async logout(@Req() req: any) {
    await this.authService.logout(req.user.id);
    
    return {
      success: true,
      message: 'Logout successful'
    };
  }

  @Post('verify-email')
  @ApiOperation({
    summary: 'Verify email address',
    description: 'Verifies user email address using verification token'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          description: 'Email verification token'
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email verified successfully'
  })
  async verifyEmail(@Body('token') token: string) {
    await this.authService.verifyEmail(token);
    
    return {
      success: true,
      message: 'Email verified successfully'
    };
  }

  @Post('resend-verification')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Resend email verification',
    description: 'Sends a new email verification link to user'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verification email sent'
  })
  async resendVerification(@Req() req: any) {
    await this.authService.resendVerificationEmail(req.user.id);
    
    return {
      success: true,
      message: 'Verification email sent successfully'
    };
  }
}
