import { Controller, Get, Query, Param, Post, Body } from '@nestjs/common';
import { ExecutionMonitorService } from './execution-monitor.service';
import { ErrorHandlerService } from './error-handler.service';
import { CircuitBreakerService } from './circuit-breaker.service';
import { LoggingService } from '@flowforge/observability-logging';

@Controller('monitoring')
export class MonitoringController {
  constructor(
    private readonly executionMonitorService: ExecutionMonitorService,
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly loggingService: LoggingService,
  ) {}

  /**
   * Get execution metrics
   */
  @Get('metrics/execution')
  getExecutionMetrics() {
    return this.executionMonitorService.getExecutionMetrics();
  }

  /**
   * Get node-specific metrics
   */
  @Get('metrics/nodes')
  getNodeMetrics() {
    return this.executionMonitorService.getNodeMetrics();
  }

  /**
   * Get system health status
   */
  @Get('health')
  async getSystemHealth() {
    return await this.executionMonitorService.getSystemHealth();
  }

  /**
   * Get execution trends
   */
  @Get('trends/execution')
  getExecutionTrends(
    @Query('timeframe') timeframe: 'hour' | 'day' | 'week' = 'hour'
  ) {
    return this.executionMonitorService.getExecutionTrends(timeframe);
  }

  /**
   * Get error statistics
   */
  @Get('errors/stats')
  getErrorStats() {
    return this.errorHandlerService.getErrorStats();
  }

  /**
   * Get circuit breaker statistics
   */
  @Get('circuit-breakers')
  getCircuitBreakerStats() {
    return this.circuitBreakerService.getAllStats();
  }

  /**
   * Get recent logs
   */
  @Get('logs/recent')
  getRecentLogs(
    @Query('limit') limit = 100,
    @Query('executionId') executionId?: string,
    @Query('workflowId') workflowId?: string,
    @Query('nodeId') nodeId?: string,
  ) {
    const filter: any = {};
    if (executionId) filter.executionId = executionId;
    if (workflowId) filter.workflowId = workflowId;
    if (nodeId) filter.nodeId = nodeId;

    return this.loggingService.getRecentLogs(Number(limit), filter);
  }

  /**
   * Force open a circuit breaker
   */
  @Post('circuit-breakers/:serviceName/open')
  forceOpenCircuitBreaker(@Param('serviceName') serviceName: string) {
    const success = this.circuitBreakerService.forceOpen(serviceName);
    return { success, message: success ? 'Circuit breaker opened' : 'Service not found' };
  }

  /**
   * Force close a circuit breaker
   */
  @Post('circuit-breakers/:serviceName/close')
  forceCloseCircuitBreaker(@Param('serviceName') serviceName: string) {
    const success = this.circuitBreakerService.forceClose(serviceName);
    return { success, message: success ? 'Circuit breaker closed' : 'Service not found' };
  }

  /**
   * Reset a circuit breaker
   */
  @Post('circuit-breakers/:serviceName/reset')
  resetCircuitBreaker(@Param('serviceName') serviceName: string) {
    const success = this.circuitBreakerService.reset(serviceName);
    return { success, message: success ? 'Circuit breaker reset' : 'Service not found' };
  }

  /**
   * Mark error as resolved
   */
  @Post('errors/:errorId/resolve')
  resolveError(@Param('errorId') errorId: string) {
    const success = this.errorHandlerService.resolveError(errorId);
    return { success, message: success ? 'Error marked as resolved' : 'Error not found' };
  }

  /**
   * Add custom alert condition
   */
  @Post('alerts')
  addAlertCondition(@Body() alertData: {
    name: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    enabled: boolean;
    cooldownPeriod: number;
    conditionType: 'error_rate' | 'memory_usage' | 'cpu_usage' | 'custom';
    threshold: number;
  }) {
    let condition: (metrics: any, health: any) => boolean;

    switch (alertData.conditionType) {
      case 'error_rate':
        condition = (metrics) => metrics.errorRate > alertData.threshold;
        break;
      case 'memory_usage':
        condition = (_, health) => health.memoryUsage > alertData.threshold;
        break;
      case 'cpu_usage':
        condition = (_, health) => health.cpuUsage > alertData.threshold;
        break;
      default:
        condition = () => false;
    }

    const alertId = this.executionMonitorService.addAlertCondition({
      name: alertData.name,
      condition,
      severity: alertData.severity,
      enabled: alertData.enabled,
      cooldownPeriod: alertData.cooldownPeriod,
    });

    return { alertId, message: 'Alert condition added successfully' };
  }

  /**
   * Remove alert condition
   */
  @Post('alerts/:alertId/remove')
  removeAlertCondition(@Param('alertId') alertId: string) {
    const success = this.executionMonitorService.removeAlertCondition(alertId);
    return { success, message: success ? 'Alert condition removed' : 'Alert not found' };
  }

  /**
   * Clear log buffer
   */
  @Post('logs/clear')
  clearLogBuffer() {
    this.loggingService.clearBuffer();
    return { message: 'Log buffer cleared successfully' };
  }

  /**
   * Cleanup old resolved errors
   */
  @Post('errors/cleanup')
  cleanupResolvedErrors(@Query('olderThanHours') olderThanHours = 24) {
    const cleaned = this.errorHandlerService.cleanupResolvedErrors(Number(olderThanHours));
    return { cleaned, message: `Cleaned up ${cleaned} resolved errors` };
  }
}
