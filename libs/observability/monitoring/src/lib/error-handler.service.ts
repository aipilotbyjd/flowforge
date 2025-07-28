import { Injectable, Logger } from '@nestjs/common';
import { LoggingService, LogContext } from '@flowforge/observability-logging';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ErrorCategory {
  NETWORK = 'network',
  DATABASE = 'database',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  EXTERNAL_SERVICE = 'external_service',
  TIMEOUT = 'timeout',
  RESOURCE_EXHAUSTION = 'resource_exhaustion',
}

export interface ErrorMetadata {
  severity: ErrorSeverity;
  category: ErrorCategory;
  isRetryable: boolean;
  maxRetries?: number;
  backoffMultiplier?: number;
  tags: string[];
  context: Record<string, any>;
  recoveryStrategy?: 'retry' | 'fallback' | 'abort' | 'circuit_breaker';
}

export interface ProcessedError {
  id: string;
  originalError: Error;
  metadata: ErrorMetadata;
  timestamp: Date;
  context: LogContext;
  occurrenceCount: number;
  lastOccurrence: Date;
  resolved: boolean;
}

@Injectable()
export class ErrorHandlerService {
  private readonly logger = new Logger(ErrorHandlerService.name);
  private readonly errorRegistry = new Map<string, ProcessedError>();
  private readonly errorCounts = new Map<string, number>();

  constructor(private readonly loggingService: LoggingService) {}

  /**
   * Process and classify an error
   */
  processError(error: Error, context: LogContext): ProcessedError {
    const metadata = this.classifyError(error);
    const errorId = this.generateErrorId(error, context);
    
    let processedError = this.errorRegistry.get(errorId);
    
    if (processedError) {
      // Update existing error
      processedError.occurrenceCount++;
      processedError.lastOccurrence = new Date();
    } else {
      // Create new processed error
      processedError = {
        id: errorId,
        originalError: error,
        metadata,
        timestamp: new Date(),
        context,
        occurrenceCount: 1,
        lastOccurrence: new Date(),
        resolved: false,
      };
      this.errorRegistry.set(errorId, processedError);
    }

    // Log the error with appropriate severity
    this.logProcessedError(processedError);

    // Handle notifications for critical errors
    if (metadata.severity === ErrorSeverity.CRITICAL) {
      this.handleCriticalError(processedError);
    }

    // Track error frequency
    this.trackErrorFrequency(errorId);

    return processedError;
  }

  /**
   * Classify error type and determine metadata
   */
  private classifyError(error: Error): ErrorMetadata {
    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('timeout') || 
        errorMessage.includes('enotfound') || errorMessage.includes('econnrefused')) {
      return {
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.NETWORK,
        isRetryable: true,
        maxRetries: 3,
        backoffMultiplier: 2,
        tags: ['network', 'connectivity'],
        context: { errorType: 'network' },
        recoveryStrategy: 'retry',
      };
    }

    // Database errors
    if (errorMessage.includes('database') || errorMessage.includes('connection') ||
        errorMessage.includes('query') || errorName.includes('queryerror')) {
      return {
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.DATABASE,
        isRetryable: true,
        maxRetries: 2,
        backoffMultiplier: 1.5,
        tags: ['database', 'persistence'],
        context: { errorType: 'database' },
        recoveryStrategy: 'retry',
      };
    }

    // Authentication errors
    if (errorMessage.includes('unauthorized') || errorMessage.includes('authentication') ||
        errorMessage.includes('invalid token') || errorMessage.includes('expired')) {
      return {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.AUTHENTICATION,
        isRetryable: false,
        tags: ['auth', 'security'],
        context: { errorType: 'authentication' },
        recoveryStrategy: 'abort',
      };
    }

    // Authorization errors
    if (errorMessage.includes('forbidden') || errorMessage.includes('access denied') ||
        errorMessage.includes('permission')) {
      return {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.AUTHORIZATION,
        isRetryable: false,
        tags: ['auth', 'permissions'],
        context: { errorType: 'authorization' },
        recoveryStrategy: 'abort',
      };
    }

    // Validation errors
    if (errorMessage.includes('validation') || errorMessage.includes('invalid') ||
        errorName.includes('validationerror')) {
      return {
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.VALIDATION,
        isRetryable: false,
        tags: ['validation', 'input'],
        context: { errorType: 'validation' },
        recoveryStrategy: 'abort',
      };
    }

    // Timeout errors
    if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
      return {
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.TIMEOUT,
        isRetryable: true,
        maxRetries: 2,
        backoffMultiplier: 2,
        tags: ['timeout', 'performance'],
        context: { errorType: 'timeout' },
        recoveryStrategy: 'retry',
      };
    }

    // External service errors
    if (errorMessage.includes('service unavailable') || errorMessage.includes('502') ||
        errorMessage.includes('503') || errorMessage.includes('504')) {
      return {
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.EXTERNAL_SERVICE,
        isRetryable: true,
        maxRetries: 3,
        backoffMultiplier: 2,
        tags: ['external', 'service'],
        context: { errorType: 'external_service' },
        recoveryStrategy: 'circuit_breaker',
      };
    }

    // Resource exhaustion
    if (errorMessage.includes('memory') || errorMessage.includes('cpu') ||
        errorMessage.includes('disk space') || errorMessage.includes('quota')) {
      return {
        severity: ErrorSeverity.CRITICAL,
        category: ErrorCategory.RESOURCE_EXHAUSTION,
        isRetryable: false,
        tags: ['resources', 'capacity'],
        context: { errorType: 'resource_exhaustion' },
        recoveryStrategy: 'abort',
      };
    }

    // Default classification
    return {
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.SYSTEM,
      isRetryable: true,
      maxRetries: 1,
      backoffMultiplier: 1,
      tags: ['system', 'unknown'],
      context: { errorType: 'unknown' },
      recoveryStrategy: 'retry',
    };
  }

  /**
   * Generate unique error ID for tracking
   */
  private generateErrorId(error: Error, context: LogContext): string {
    const components = [
      error.name,
      error.message.substring(0, 100),
      context.workflowId || 'no-workflow',
      context.nodeId || 'no-node',
    ];
    
    return Buffer.from(components.join('|')).toString('base64').substring(0, 16);
  }

  /**
   * Log processed error with structured data
   */
  private logProcessedError(processedError: ProcessedError): void {
    const { originalError, metadata, context, occurrenceCount } = processedError;
    
    this.loggingService.logExecutionError(
      {
        ...context,
        metadata: {
          ...context.metadata,
          errorId: processedError.id,
          severity: metadata.severity,
          category: metadata.category,
          isRetryable: metadata.isRetryable,
          occurrenceCount,
          tags: metadata.tags,
        },
      },
      originalError
    );
  }

  /**
   * Handle critical errors with immediate notification
   */
  private handleCriticalError(processedError: ProcessedError): void {
    this.logger.error(`CRITICAL ERROR DETECTED: ${processedError.originalError.message}`);
    
    // In a real implementation, you would send notifications via:
    // - Email alerts
    // - Slack/Teams messages
    // - PagerDuty incidents
    // - SMS alerts
    // - Dashboard alerts
    
    this.loggingService.logSecurityEvent(
      `Critical error: ${processedError.originalError.name}`,
      processedError.context,
      'critical'
    );
  }

  /**
   * Track error frequency for trend analysis
   */
  private trackErrorFrequency(errorId: string): void {
    const currentCount = this.errorCounts.get(errorId) || 0;
    const newCount = currentCount + 1;
    this.errorCounts.set(errorId, newCount);

    // Alert if error frequency is too high
    if (newCount > 10) { // Threshold for frequent errors
      this.logger.warn(`High frequency error detected: ${errorId} (${newCount} occurrences)`);
    }
  }

  /**
   * Determine if error should be retried
   */
  shouldRetry(processedError: ProcessedError, currentAttempt: number): boolean {
    const { metadata } = processedError;
    
    if (!metadata.isRetryable) {
      return false;
    }

    if (metadata.maxRetries && currentAttempt >= metadata.maxRetries) {
      return false;
    }

    // Don't retry if error is occurring too frequently
    const errorCount = this.errorCounts.get(processedError.id) || 0;
    if (errorCount > 20) { // Circuit breaker threshold
      return false;
    }

    return true;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  calculateRetryDelay(processedError: ProcessedError, attempt: number): number {
    const { backoffMultiplier = 1 } = processedError.metadata;
    const baseDelay = 1000; // 1 second base delay
    
    return Math.min(baseDelay * Math.pow(backoffMultiplier, attempt), 30000); // Max 30 seconds
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    topErrors: Array<{ id: string; count: number; message: string }>;
  } {
    const errorsByCategory: Record<ErrorCategory, number> = {} as any;
    const errorsBySeverity: Record<ErrorSeverity, number> = {} as any;

    for (const processedError of this.errorRegistry.values()) {
      const category = processedError.metadata.category;
      const severity = processedError.metadata.severity;
      
      errorsByCategory[category] = (errorsByCategory[category] || 0) + processedError.occurrenceCount;
      errorsBySeverity[severity] = (errorsBySeverity[severity] || 0) + processedError.occurrenceCount;
    }

    const topErrors = Array.from(this.errorRegistry.values())
      .sort((a, b) => b.occurrenceCount - a.occurrenceCount)
      .slice(0, 10)
      .map(error => ({
        id: error.id,
        count: error.occurrenceCount,
        message: error.originalError.message,
      }));

    return {
      totalErrors: this.errorRegistry.size,
      errorsByCategory,
      errorsBySeverity,
      topErrors,
    };
  }

  /**
   * Mark error as resolved
   */
  resolveError(errorId: string): boolean {
    const processedError = this.errorRegistry.get(errorId);
    if (processedError) {
      processedError.resolved = true;
      return true;
    }
    return false;
  }

  /**
   * Clear resolved errors older than specified time
   */
  cleanupResolvedErrors(olderThanHours = 24): number {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    let cleaned = 0;

    for (const [errorId, processedError] of this.errorRegistry.entries()) {
      if (processedError.resolved && processedError.lastOccurrence < cutoffTime) {
        this.errorRegistry.delete(errorId);
        this.errorCounts.delete(errorId);
        cleaned++;
      }
    }

    this.logger.log(`Cleaned up ${cleaned} resolved errors`);
    return cleaned;
  }
}
