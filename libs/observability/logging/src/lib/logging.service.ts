import { Injectable, Logger, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface LogContext {
  executionId?: string;
  workflowId?: string;
  nodeId?: string;
  userId?: string;
  organizationId?: string;
  correlationId?: string;
  requestId?: string;
  sessionId?: string;
  component?: string;
  operation?: string;
  metadata?: Record<string, any>;
}

export interface StructuredLogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
    details?: any;
  };
  performance?: {
    duration: number;
    memoryUsage?: number;
    cpuUsage?: number;
  };
  tags?: string[];
}

@Injectable()
export class LoggingService {
  private readonly logger = new Logger(LoggingService.name);
  private readonly logLevel: LogLevel;
  private readonly enableStructuredLogging: boolean;
  private readonly logBuffer: StructuredLogEntry[] = [];
  private readonly maxBufferSize = 1000;

  constructor(private readonly configService: ConfigService) {
    this.logLevel = this.configService.get<LogLevel>('LOG_LEVEL', 'log');
    this.enableStructuredLogging = this.configService.get<boolean>('STRUCTURED_LOGGING', true);
  }

  /**
   * Log execution start
   */
  logExecutionStart(context: LogContext): void {
    this.structuredLog('log', 'Execution started', {
      ...context,
      component: 'execution-engine',
      operation: 'start',
    }, ['execution', 'start']);
  }

  /**
   * Log execution completion
   */
  logExecutionComplete(context: LogContext, duration: number, result?: any): void {
    this.structuredLog('log', 'Execution completed successfully', {
      ...context,
      component: 'execution-engine',
      operation: 'complete',
      metadata: { ...(context.metadata || {}), result: result ? 'success' : 'no-result' }
    }, ['execution', 'complete', 'success'], {
      performance: { duration }
    });
  }

  /**
   * Log execution failure
   */
  logExecutionError(context: LogContext, error: Error, duration?: number): void {
    this.structuredLog('error', 'Execution failed', {
      ...context,
      component: 'execution-engine',
      operation: 'error',
    }, ['execution', 'error', 'failure'], {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
        details: (error as any).details,
      },
      performance: duration ? { duration } : undefined,
    });
  }

  /**
   * Log node execution
   */
  logNodeExecution(context: LogContext, nodeType: string, status: string, duration?: number): void {
    this.structuredLog('log', `Node ${status}: ${nodeType}`, {
      ...context,
      component: 'node-executor',
      operation: status.toLowerCase(),
      metadata: { ...(context.metadata || {}), nodeType }
    }, ['node', 'execution', status.toLowerCase()], {
      performance: duration ? { duration } : undefined,
    });
  }

  /**
   * Log retry attempt
   */
  logRetryAttempt(context: LogContext, attempt: number, maxRetries: number, reason: string): void {
    this.structuredLog('warn', `Retry attempt ${attempt}/${maxRetries}: ${reason}`, {
      ...context,
      component: 'retry-handler',
      operation: 'retry',
      metadata: { ...(context.metadata || {}), attempt, maxRetries, reason }
    }, ['retry', 'attempt']);
  }

  /**
   * Log queue operations
   */
  logQueueOperation(operation: string, queueName: string, jobId: string, context: LogContext): void {
    this.structuredLog('debug', `Queue ${operation}: ${queueName}`, {
      ...context,
      component: 'queue-manager',
      operation: operation.toLowerCase(),
      metadata: { ...(context.metadata || {}), queueName, jobId }
    }, ['queue', operation.toLowerCase()]);
  }

  /**
   * Log security events
   */
  logSecurityEvent(event: string, context: LogContext, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'): void {
    const level: LogLevel = severity === 'critical' ? 'error' : severity === 'high' ? 'warn' : 'log';
    this.structuredLog(level, `Security event: ${event}`, {
      ...context,
      component: 'security',
      operation: 'security-event',
      metadata: { ...(context.metadata || {}), event, severity }
    }, ['security', 'event', severity]);
  }

  /**
   * Log performance metrics
   */
  logPerformanceMetrics(context: LogContext, metrics: {
    duration: number;
    memoryUsage?: number;
    cpuUsage?: number;
    throughput?: number;
  }): void {
    this.structuredLog('log', 'Performance metrics', {
      ...context,
      component: 'performance-monitor',
      operation: 'metrics',
    }, ['performance', 'metrics'], {
      performance: metrics,
    });
  }

  /**
   * Log webhook events
   */
  logWebhookEvent(context: LogContext, event: string, httpStatus: number, responseTime: number): void {
    this.structuredLog('log', `Webhook ${event}`, {
      ...context,
      component: 'webhook-handler',
      operation: event.toLowerCase(),
      metadata: { ...(context.metadata || {}), httpStatus }
    }, ['webhook', event.toLowerCase()], {
      performance: { duration: responseTime }
    });
  }

  /**
   * Log database operations
   */
  logDatabaseOperation(operation: string, table: string, context: LogContext, duration?: number): void {
    this.structuredLog('debug', `Database ${operation}: ${table}`, {
      ...context,
      component: 'database',
      operation: operation.toLowerCase(),
      metadata: { ...(context.metadata || {}), table }
    }, ['database', operation.toLowerCase()], {
      performance: duration ? { duration } : undefined,
    });
  }

  /**
   * Create a child logger with additional context
   */
  createChildLogger(additionalContext: Partial<LogContext>): ChildLogger {
    return new ChildLogger(this, additionalContext);
  }

  /**
   * Get recent logs for debugging
   */
  getRecentLogs(limit = 100, filter?: Partial<LogContext>): StructuredLogEntry[] {
    let logs = this.logBuffer.slice(-limit);
    
    if (filter) {
      logs = logs.filter(log => {
        return Object.entries(filter).every(([key, value]) => {
          return log.context[key as keyof LogContext] === value;
        });
      });
    }

    return logs;
  }

  /**
   * Clear log buffer
   */
  clearBuffer(): void {
    this.logBuffer.length = 0;
  }

  private structuredLog(
    level: LogLevel,
    message: string,
    context: LogContext,
    tags: string[] = [],
    additional?: {
      error?: StructuredLogEntry['error'];
      performance?: StructuredLogEntry['performance'];
    }
  ): void {
    const entry: StructuredLogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      tags,
      ...additional,
    };

    // Add to buffer
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }

    // Output log
    if (this.enableStructuredLogging) {
      this.outputStructuredLog(entry);
    } else {
      this.outputSimpleLog(level, message, context);
    }
  }

  private outputStructuredLog(entry: StructuredLogEntry): void {
    const logData = {
      timestamp: entry.timestamp.toISOString(),
      level: entry.level,
      message: entry.message,
      context: entry.context,
      tags: entry.tags,
      ...(entry.error && { error: entry.error }),
      ...(entry.performance && { performance: entry.performance }),
    };

    console.log(JSON.stringify(logData));
  }

  private outputSimpleLog(level: LogLevel, message: string, context: LogContext): void {
    const contextStr = Object.entries(context)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key}=${value}`)
      .join(' ');

    const fullMessage = contextStr ? `${message} [${contextStr}]` : message;

    switch (level) {
      case 'error':
        this.logger.error(fullMessage);
        break;
      case 'warn':
        this.logger.warn(fullMessage);
        break;
      case 'debug':
        this.logger.debug(fullMessage);
        break;
      case 'verbose':
        this.logger.verbose(fullMessage);
        break;
      default:
        this.logger.log(fullMessage);
    }
  }
}

/**
 * Child logger with inherited context
 */
export class ChildLogger {
  constructor(
    private readonly parentLogger: LoggingService,
    private readonly baseContext: Partial<LogContext>
  ) {}

  logExecutionStart(additionalContext: Partial<LogContext> = {}): void {
    this.parentLogger.logExecutionStart({ ...this.baseContext, ...additionalContext });
  }

  logExecutionComplete(duration: number, result?: any, additionalContext: Partial<LogContext> = {}): void {
    this.parentLogger.logExecutionComplete({ ...this.baseContext, ...additionalContext }, duration, result);
  }

  logExecutionError(error: Error, duration?: number, additionalContext: Partial<LogContext> = {}): void {
    this.parentLogger.logExecutionError({ ...this.baseContext, ...additionalContext }, error, duration);
  }

  logNodeExecution(nodeType: string, status: string, duration?: number, additionalContext: Partial<LogContext> = {}): void {
    this.parentLogger.logNodeExecution({ ...this.baseContext, ...additionalContext }, nodeType, status, duration);
  }

  logRetryAttempt(attempt: number, maxRetries: number, reason: string, additionalContext: Partial<LogContext> = {}): void {
    this.parentLogger.logRetryAttempt({ ...this.baseContext, ...additionalContext }, attempt, maxRetries, reason);
  }

  logQueueOperation(operation: string, queueName: string, jobId: string, additionalContext: Partial<LogContext> = {}): void {
    this.parentLogger.logQueueOperation(operation, queueName, jobId, { ...this.baseContext, ...additionalContext });
  }

  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium', additionalContext: Partial<LogContext> = {}): void {
    this.parentLogger.logSecurityEvent(event, { ...this.baseContext, ...additionalContext }, severity);
  }

  logPerformanceMetrics(metrics: { duration: number; memoryUsage?: number; cpuUsage?: number; throughput?: number }, additionalContext: Partial<LogContext> = {}): void {
    this.parentLogger.logPerformanceMetrics({ ...this.baseContext, ...additionalContext }, metrics);
  }

  logWebhookEvent(event: string, httpStatus: number, responseTime: number, additionalContext: Partial<LogContext> = {}): void {
    this.parentLogger.logWebhookEvent({ ...this.baseContext, ...additionalContext }, event, httpStatus, responseTime);
  }

  logDatabaseOperation(operation: string, table: string, duration?: number, additionalContext: Partial<LogContext> = {}): void {
    this.parentLogger.logDatabaseOperation(operation, table, { ...this.baseContext, ...additionalContext }, duration);
  }
}
