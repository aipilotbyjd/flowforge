import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { LoggingService, LogContext } from './logging.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  constructor(private readonly loggingService: LoggingService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    // Generate correlation ID if not present
    const correlationId = request.headers['x-correlation-id'] as string || uuidv4();
    const requestId = uuidv4();

    // Extract context information
    const logContext: LogContext = {
      correlationId,
      requestId,
      userId: (request as any).user?.id,
      organizationId: (request as any).user?.organizationId,
      component: 'api',
      operation: `${request.method} ${request.path}`,
      metadata: {
        method: request.method,
        url: request.url,
        userAgent: request.headers['user-agent'],
        ip: request.ip,
        path: request.path,
        query: request.query,
      },
    };

    // Set correlation ID in response headers
    response.setHeader('X-Correlation-ID', correlationId);

    // Log request start
    this.loggingService.logExecutionStart(logContext);

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        
        // Log successful completion
        this.loggingService.logExecutionComplete(
          {
            ...logContext,
            metadata: {
              ...logContext.metadata,
              statusCode: response.statusCode,
              responseSize: JSON.stringify(data || {}).length,
            },
          },
          duration,
          data
        );
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        
        // Log error
        this.loggingService.logExecutionError(
          {
            ...logContext,
            metadata: {
              ...logContext.metadata,
              statusCode: response.statusCode || 500,
            },
          },
          error,
          duration
        );

        throw error;
      })
    );
  }
}
