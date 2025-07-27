import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('node-executor')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get node executor status' })
  @ApiResponse({ status: 200, description: 'Node executor is running' })
  getData() {
    return this.appService.getData();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check for node executor' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealthStatus() {
    return {
      status: 'healthy',
      service: 'node-executor',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    };
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get node executor metrics' })
  @ApiResponse({ status: 200, description: 'Service metrics' })
  getMetrics() {
    return {
      service: 'node-executor',
      metrics: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        timestamp: new Date().toISOString(),
      },
    };
  }
}
