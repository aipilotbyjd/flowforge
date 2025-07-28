import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { LoggingService, LogContext } from '@flowforge/observability-logging';

export interface ExecutionMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  executionsPerMinute: number;
  activeExecutions: number;
  queuedExecutions: number;
  errorRate: number;
  successRate: number;
  lastUpdated: Date;
}

export interface NodeMetrics {
  nodeType: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  minExecutionTime: number;
  maxExecutionTime: number;
  errorRate: number;
  lastExecuted: Date;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  activeConnections: number;
  queueHealth: {
    workflowQueue: QueueHealth;
    nodeQueue: QueueHealth;
  };
  lastHealthCheck: Date;
}

export interface QueueHealth {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
  isHealthy: boolean;
}

export interface AlertCondition {
  id: string;
  name: string;
  condition: (metrics: ExecutionMetrics, health: SystemHealth) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  cooldownPeriod: number; // minutes
  lastTriggered?: Date;
}

@Injectable()
export class ExecutionMonitorService {
  private readonly logger = new Logger(ExecutionMonitorService.name);
  private readonly executionHistory: Array<{
    timestamp: Date;
    type: 'workflow' | 'node';
    executionId: string;
    duration: number;
    status: 'success' | 'failure';
    nodeType?: string;
  }> = [];
  
  private readonly nodeMetricsMap = new Map<string, NodeMetrics>();
  private readonly alertConditions: AlertCondition[] = [];
  private readonly maxHistorySize = 10000;
  private systemStartTime = new Date();

  constructor(private readonly loggingService: LoggingService) {
    this.initializeDefaultAlerts();
  }

  /**
   * Record execution start
   */
  recordExecutionStart(
    type: 'workflow' | 'node',
    executionId: string,
    context: LogContext
  ): void {
    this.loggingService.logExecutionStart({
      ...context,
      component: 'execution-monitor',
      metadata: { 
        ...context.metadata, 
        type, 
        executionId 
      },
    });
  }

  /**
   * Record execution completion
   */
  recordExecutionComplete(
    type: 'workflow' | 'node',
    executionId: string,
    duration: number,
    context: LogContext,
    nodeType?: string
  ): void {
    const record = {
      timestamp: new Date(),
      type,
      executionId,
      duration,
      status: 'success' as const,
      nodeType,
    };

    this.addToHistory(record);
    this.updateNodeMetrics(nodeType, duration, true);

    this.loggingService.logExecutionComplete(
      {
        ...context,
        component: 'execution-monitor',
        metadata: { 
          ...context.metadata, 
          type, 
          executionId,
          nodeType 
        },
      },
      duration
    );
  }

  /**
   * Record execution failure
   */
  recordExecutionFailure(
    type: 'workflow' | 'node',
    executionId: string,
    duration: number,
    error: Error,
    context: LogContext,
    nodeType?: string
  ): void {
    const record = {
      timestamp: new Date(),
      type,
      executionId,
      duration,
      status: 'failure' as const,
      nodeType,
    };

    this.addToHistory(record);
    this.updateNodeMetrics(nodeType, duration, false);

    this.loggingService.logExecutionError(
      {
        ...context,
        component: 'execution-monitor',
        metadata: { 
          ...context.metadata, 
          type, 
          executionId,
          nodeType 
        },
      },
      error,
      duration
    );
  }

  /**
   * Get current execution metrics
   */
  getExecutionMetrics(): ExecutionMetrics {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    const recentExecutions = this.executionHistory.filter(
      record => record.timestamp >= oneMinuteAgo
    );

    const totalExecutions = this.executionHistory.length;
    const successfulExecutions = this.executionHistory.filter(
      r => r.status === 'success'
    ).length;
    const failedExecutions = totalExecutions - successfulExecutions;

    const totalDuration = this.executionHistory.reduce(
      (sum, record) => sum + record.duration, 0
    );
    const averageExecutionTime = totalExecutions > 0 ? 
      totalDuration / totalExecutions : 0;

    const executionsPerMinute = recentExecutions.length;
    const errorRate = totalExecutions > 0 ? 
      (failedExecutions / totalExecutions) * 100 : 0;
    const successRate = 100 - errorRate;

    return {
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      averageExecutionTime,
      executionsPerMinute,
      activeExecutions: 0, // This would be populated from queue service
      queuedExecutions: 0, // This would be populated from queue service
      errorRate,
      successRate,
      lastUpdated: now,
    };
  }

  /**
   * Get node-specific metrics
   */
  getNodeMetrics(): NodeMetrics[] {
    return Array.from(this.nodeMetricsMap.values());
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const uptime = Date.now() - this.systemStartTime.getTime();
    const memoryUsage = this.getMemoryUsage();
    const cpuUsage = await this.getCpuUsage();
    const diskUsage = await this.getDiskUsage();

    const metrics = this.getExecutionMetrics();
    let status: SystemHealth['status'] = 'healthy';

    // Determine health status based on metrics
    if (metrics.errorRate > 50 || memoryUsage > 90 || cpuUsage > 90) {
      status = 'unhealthy';
    } else if (metrics.errorRate > 20 || memoryUsage > 75 || cpuUsage > 75) {
      status = 'degraded';
    }

    return {
      status,
      uptime,
      memoryUsage,
      cpuUsage,
      diskUsage,
      activeConnections: 0, // Would be populated from connection pools
      queueHealth: {
        workflowQueue: await this.getQueueHealth('workflow'),
        nodeQueue: await this.getQueueHealth('node'),
      },
      lastHealthCheck: new Date(),
    };
  }

  /**
   * Add alert condition
   */
  addAlertCondition(condition: Omit<AlertCondition, 'id'>): string {
    const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.alertConditions.push({ ...condition, id });
    return id;
  }

  /**
   * Remove alert condition
   */
  removeAlertCondition(id: string): boolean {
    const index = this.alertConditions.findIndex(c => c.id === id);
    if (index >= 0) {
      this.alertConditions.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Check alerts periodically
   */
  @Interval(30000) // Every 30 seconds
  async checkAlerts(): Promise<void> {
    const metrics = this.getExecutionMetrics();
    const health = await this.getSystemHealth();
    const now = new Date();

    for (const alert of this.alertConditions) {
      if (!alert.enabled) continue;

      // Check cooldown period
      if (alert.lastTriggered) {
        const cooldownMs = alert.cooldownPeriod * 60 * 1000;
        if (now.getTime() - alert.lastTriggered.getTime() < cooldownMs) {
          continue;
        }
      }

      // Evaluate condition
      if (alert.condition(metrics, health)) {
        await this.triggerAlert(alert, metrics, health);
        alert.lastTriggered = now;
      }
    }
  }

  /**
   * Get execution trend data
   */
  getExecutionTrends(timeframe: 'hour' | 'day' | 'week' = 'hour'): Array<{
    timestamp: Date;
    successCount: number;
    failureCount: number;
    averageDuration: number;
  }> {
    const now = new Date();
    let timeframeMs: number;
    let bucketSize: number;

    switch (timeframe) {
      case 'hour':
        timeframeMs = 60 * 60 * 1000; // 1 hour
        bucketSize = 5 * 60 * 1000; // 5 minute buckets
        break;
      case 'day':
        timeframeMs = 24 * 60 * 60 * 1000; // 24 hours
        bucketSize = 60 * 60 * 1000; // 1 hour buckets
        break;
      case 'week':
        timeframeMs = 7 * 24 * 60 * 60 * 1000; // 7 days
        bucketSize = 6 * 60 * 60 * 1000; // 6 hour buckets
        break;
    }

    const startTime = new Date(now.getTime() - timeframeMs);
    const relevantExecutions = this.executionHistory.filter(
      record => record.timestamp >= startTime
    );

    const buckets = new Map<number, {
      successCount: number;
      failureCount: number;
      totalDuration: number;
      count: number;
    }>();

    // Group executions into time buckets
    relevantExecutions.forEach(record => {
      const bucketStart = Math.floor(record.timestamp.getTime() / bucketSize) * bucketSize;
      const bucket = buckets.get(bucketStart) || {
        successCount: 0,
        failureCount: 0,
        totalDuration: 0,
        count: 0,
      };

      if (record.status === 'success') {
        bucket.successCount++;
      } else {
        bucket.failureCount++;
      }
      bucket.totalDuration += record.duration;
      bucket.count++;

      buckets.set(bucketStart, bucket);
    });

    // Convert to trend data
    return Array.from(buckets.entries())
      .sort(([a], [b]) => a - b)
      .map(([timestamp, bucket]) => ({
        timestamp: new Date(timestamp),
        successCount: bucket.successCount,
        failureCount: bucket.failureCount,
        averageDuration: bucket.count > 0 ? bucket.totalDuration / bucket.count : 0,
      }));
  }

  private addToHistory(record: typeof this.executionHistory[0]): void {
    this.executionHistory.push(record);
    
    // Maintain history size limit
    while (this.executionHistory.length > this.maxHistorySize) {
      this.executionHistory.shift();
    }
  }

  private updateNodeMetrics(nodeType: string | undefined, duration: number, success: boolean): void {
    if (!nodeType) return;

    let metrics = this.nodeMetricsMap.get(nodeType);
    if (!metrics) {
      metrics = {
        nodeType,
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageExecutionTime: 0,
        minExecutionTime: Number.MAX_SAFE_INTEGER,
        maxExecutionTime: 0,
        errorRate: 0,
        lastExecuted: new Date(),
      };
      this.nodeMetricsMap.set(nodeType, metrics);
    }

    metrics.totalExecutions++;
    if (success) {
      metrics.successfulExecutions++;
    } else {
      metrics.failedExecutions++;
    }

    // Update timing metrics
    const totalDuration = metrics.averageExecutionTime * (metrics.totalExecutions - 1) + duration;
    metrics.averageExecutionTime = totalDuration / metrics.totalExecutions;
    metrics.minExecutionTime = Math.min(metrics.minExecutionTime, duration);
    metrics.maxExecutionTime = Math.max(metrics.maxExecutionTime, duration);
    metrics.errorRate = (metrics.failedExecutions / metrics.totalExecutions) * 100;
    metrics.lastExecuted = new Date();
  }

  private async triggerAlert(
    alert: AlertCondition,
    metrics: ExecutionMetrics,
    health: SystemHealth
  ): Promise<void> {
    this.logger.warn(`Alert triggered: ${alert.name}`);

    this.loggingService.logSecurityEvent(
      `Alert: ${alert.name}`,
      {
        component: 'execution-monitor',
        operation: 'alert',
        metadata: {
          alertId: alert.id,
          severity: alert.severity,
          metrics,
          health,
        },
      },
      alert.severity
    );

    // In a real implementation, you would send notifications here
    // - Email alerts
    // - Slack/Teams messages  
    // - PagerDuty incidents
    // - Webhook notifications
  }

  private initializeDefaultAlerts(): void {
    // High error rate alert
    this.addAlertCondition({
      name: 'High Error Rate',
      condition: (metrics) => metrics.errorRate > 25,
      severity: 'high',
      enabled: true,
      cooldownPeriod: 10,
    });

    // System unhealthy alert
    this.addAlertCondition({
      name: 'System Unhealthy',
      condition: (_, health) => health.status === 'unhealthy',
      severity: 'critical',
      enabled: true,
      cooldownPeriod: 5,
    });

    // Low throughput alert
    this.addAlertCondition({
      name: 'Low Throughput',
      condition: (metrics) => metrics.executionsPerMinute === 0 && metrics.queuedExecutions > 0,
      severity: 'medium',
      enabled: true,
      cooldownPeriod: 15,
    });

    // High memory usage alert
    this.addAlertCondition({
      name: 'High Memory Usage',
      condition: (_, health) => health.memoryUsage > 85,
      severity: 'high',
      enabled: true,
      cooldownPeriod: 10,
    });
  }

  private getMemoryUsage(): number {
    const usage = process.memoryUsage();
    const totalMemory = usage.heapTotal + usage.external;
    const maxMemory = 1024 * 1024 * 1024; // Assume 1GB max for demo
    return (totalMemory / maxMemory) * 100;
  }

  private async getCpuUsage(): Promise<number> {
    // Simplified CPU usage calculation
    // In a real implementation, you'd use a proper CPU monitoring library
    return Math.random() * 20; // Mock data for demo
  }

  private async getDiskUsage(): Promise<number> {
    // Simplified disk usage calculation  
    // In a real implementation, you'd check actual disk usage
    return Math.random() * 30; // Mock data for demo
  }

  private async getQueueHealth(queueType: 'workflow' | 'node'): Promise<QueueHealth> {
    // This would integrate with the actual queue service
    // For now, return mock data
    const waiting = Math.floor(Math.random() * 10);
    const active = Math.floor(Math.random() * 5);
    const failed = Math.floor(Math.random() * 3);
    
    return {
      waiting,
      active,
      completed: Math.floor(Math.random() * 100),
      failed,
      delayed: Math.floor(Math.random() * 2),
      paused: 0,
      isHealthy: failed < 5 && waiting < 20,
    };
  }
}
