import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@flowforge/security/auth';
import { CredentialType } from '@flowforge/core-entities';
import { CredentialsService } from './credentials.service';

class CreateCredentialDto {
  name: string;
  description?: string;
  type: CredentialType;
  data: Record<string, any>;
  expiresAt?: Date;
}

class UpdateCredentialDto {
  name?: string;
  description?: string;
  data?: Record<string, any>;
  expiresAt?: Date;
  isActive?: boolean;
}

@ApiTags('credentials')
@Controller('credentials')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CredentialsController {
  private readonly logger = new Logger(CredentialsController.name);

  constructor(private readonly credentialsService: CredentialsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new credential' })
  @ApiResponse({ status: 201, description: 'Credential created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or credential already exists' })
  @ApiBody({ type: CreateCredentialDto })
  async createCredential(
    @Body() createCredentialDto: CreateCredentialDto,
    @Request() req: any,
  ) {
    this.logger.log(`Creating credential: ${createCredentialDto.name}`);

    const credential = await this.credentialsService.createCredential({
      ...createCredentialDto,
      organizationId: req.user.organizationId,
      createdById: req.user.id,
    });

    return {
      success: true,
      message: 'Credential created successfully',
      data: {
        id: credential.id,
        name: credential.name,
        type: credential.type,
        description: credential.description,
        isActive: credential.isActive,
        expiresAt: credential.expiresAt,
        createdAt: credential.createdAt,
      },
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all credentials for organization' })
  @ApiQuery({ name: 'type', required: false, enum: CredentialType })
  @ApiResponse({ status: 200, description: 'Credentials retrieved successfully' })
  async listCredentials(
    @Query('type') type: CredentialType,
    @Request() req: any,
  ) {
    const credentials = await this.credentialsService.listCredentials(
      req.user.organizationId,
      type,
    );

    return {
      success: true,
      data: credentials.map(credential => ({
        id: credential.id,
        name: credential.name,
        type: credential.type,
        description: credential.description,
        isActive: credential.isActive,
        isExpired: credential.isExpired,
        expiresAt: credential.expiresAt,
        createdAt: credential.createdAt,
        createdBy: credential.createdBy ? {
          id: credential.createdBy.id,
          email: credential.createdBy.email,
          firstName: credential.createdBy.firstName,
          lastName: credential.createdBy.lastName,
        } : null,
      })),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get credential by ID (without sensitive data)' })
  @ApiParam({ name: 'id', description: 'Credential ID' })
  @ApiResponse({ status: 200, description: 'Credential retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Credential not found' })
  async getCredential(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const credential = await this.credentialsService.getCredential(
      id,
      req.user.organizationId,
    );

    return {
      success: true,
      data: {
        id: credential.id,
        name: credential.name,
        type: credential.type,
        description: credential.description,
        isActive: credential.isActive,
        isExpired: credential.isExpired,
        expiresAt: credential.expiresAt,
        createdAt: credential.createdAt,
        updatedAt: credential.updatedAt,
      },
    };
  }

  @Get(':id/data')
  @ApiOperation({ summary: 'Get credential with decrypted data (sensitive)' })
  @ApiParam({ name: 'id', description: 'Credential ID' })
  @ApiResponse({ status: 200, description: 'Credential data retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Credential not found' })
  async getCredentialWithData(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const credential = await this.credentialsService.getCredentialWithData(
      id,
      req.user.organizationId,
    );

    this.logger.log(`Accessed sensitive credential data: ${id} by user ${req.user.id}`);

    return {
      success: true,
      data: {
        id: credential.id,
        name: credential.name,
        type: credential.type,
        data: credential.data,
        isActive: credential.isActive,
        expiresAt: credential.expiresAt,
      },
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update credential' })
  @ApiParam({ name: 'id', description: 'Credential ID' })
  @ApiBody({ type: UpdateCredentialDto })
  @ApiResponse({ status: 200, description: 'Credential updated successfully' })
  @ApiResponse({ status: 404, description: 'Credential not found' })
  async updateCredential(
    @Param('id') id: string,
    @Body() updateCredentialDto: UpdateCredentialDto,
    @Request() req: any,
  ) {
    const credential = await this.credentialsService.updateCredential(
      id,
      req.user.organizationId,
      updateCredentialDto,
    );

    return {
      success: true,
      message: 'Credential updated successfully',
      data: {
        id: credential.id,
        name: credential.name,
        type: credential.type,
        description: credential.description,
        isActive: credential.isActive,
        expiresAt: credential.expiresAt,
        updatedAt: credential.updatedAt,
      },
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete credential' })
  @ApiParam({ name: 'id', description: 'Credential ID' })
  @ApiResponse({ status: 200, description: 'Credential deleted successfully' })
  @ApiResponse({ status: 404, description: 'Credential not found' })
  async deleteCredential(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    await this.credentialsService.deleteCredential(id, req.user.organizationId);

    return {
      success: true,
      message: 'Credential deleted successfully',
    };
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Test credential validity' })
  @ApiParam({ name: 'id', description: 'Credential ID' })
  @ApiResponse({ status: 200, description: 'Credential test completed' })
  async testCredential(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const result = await this.credentialsService.testCredential(
      id,
      req.user.organizationId,
    );

    return {
      success: true,
      data: result,
    };
  }

  @Get('stats/overview')
  @ApiOperation({ summary: 'Get credentials statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getCredentialsStats(@Request() req: any) {
    const stats = await this.credentialsService.getCredentialStats(
      req.user.organizationId,
    );

    return {
      success: true,
      data: stats,
    };
  }

  @Get('types/:type')
  @ApiOperation({ summary: 'Get credentials by type' })
  @ApiParam({ name: 'type', enum: CredentialType, description: 'Credential type' })
  @ApiResponse({ status: 200, description: 'Credentials retrieved successfully' })
  async getCredentialsByType(
    @Param('type') type: CredentialType,
    @Request() req: any,
  ) {
    const credentials = await this.credentialsService.getCredentialsByType(
      req.user.organizationId,
      type,
    );

    return {
      success: true,
      data: credentials.map(credential => ({
        id: credential.id,
        name: credential.name,
        description: credential.description,
        isActive: credential.isActive,
        isExpired: credential.isExpired,
        expiresAt: credential.expiresAt,
        createdAt: credential.createdAt,
      })),
    };
  }

  @Post(':id/activate')  
  @ApiOperation({ summary: 'Activate credential' })
  @ApiParam({ name: 'id', description: 'Credential ID' })
  @ApiResponse({ status: 200, description: 'Credential activated successfully' })
  async activateCredential(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const credential = await this.credentialsService.updateCredential(
      id,
      req.user.organizationId,
      { isActive: true },
    );

    return {
      success: true,
      message: 'Credential activated successfully',
      data: {
        id: credential.id,
        isActive: credential.isActive,
      },
    };
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate credential' })
  @ApiParam({ name: 'id', description: 'Credential ID' })
  @ApiResponse({ status: 200, description: 'Credential deactivated successfully' })
  async deactivateCredential(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const credential = await this.credentialsService.updateCredential(
      id,
      req.user.organizationId,
      { isActive: false },
    );

    return {
      success: true,
      message: 'Credential deactivated successfully',
      data: {
        id: credential.id,
        isActive: credential.isActive,
      },
    };
  }
}
