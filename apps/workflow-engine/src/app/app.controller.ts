import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('workflow-engine')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get workflow engine status' })
  @ApiResponse({ status: 200, description: 'Workflow engine is running' })
  getData() {
    return this.appService.getData();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check for workflow engine' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealthStatus() {
    return {
      status: 'healthy',
      service: 'workflow-engine',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
