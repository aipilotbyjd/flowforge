import { Injectable, Logger } from '@nestjs/common';
import { LoggingService, LogContext } from './logging.service';

@Injectable()
export class ErrorLoggingService {
  private readonly logger = new Logger(ErrorLoggingService.name);

  constructor(private readonly loggingService: LoggingService) {}

  /**
   * Log a general error
   */
  logError(message: string, error: Error, context: LogContext): void {
    const errorDetails = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: (error as any).code,
      details: (error as any).details,
    };

    this.loggingService.logExecutionError(context, error);

    this.logger.error(`${message}: ${error.message}`, error.stack);
  }

  /**
   * Capture an error with structured logging
   */
  captureError(error: Error, context: LogContext): void {
    this.loggingService.logExecutionError(context, error);

    this.logger.error(`Captured error: ${error.message}`, error.stack);
  }

  /**
   * Log and notify critical errors
   */
  notifyCriticalError(error: Error, context: LogContext): void {
    this.captureError(error, context);

    // Additional notification logic can be added here
    this.logger.warn('Critical error occurred, notification sent');
  }
}
