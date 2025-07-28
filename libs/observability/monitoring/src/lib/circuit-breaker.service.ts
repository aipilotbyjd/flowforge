import { Injectable, Logger } from '@nestjs/common';
import { LoggingService, LogContext } from '@flowforge/observability-logging';

export enum CircuitState {
  CLOSED = 'closed',     // Normal operation
  OPEN = 'open',         // Failing fast
  HALF_OPEN = 'half_open' // Testing if service is back
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  monitoringPeriod: number;
  onOpen?: () => void;
  onHalfOpen?: () => void;
  onClose?: () => void;
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  totalCalls: number;
  lastFailureTime: Date | null;
  nextAttemptTime: Date | null;
  uptime: number;
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly circuits = new Map<string, CircuitBreaker>();

  constructor(private readonly loggingService: LoggingService) {}

  /**
   * Create or get circuit breaker for a service
   */
  getCircuit(
    serviceName: string, 
    config: Partial<CircuitBreakerConfig> = {}
  ): CircuitBreaker {
    let circuit = this.circuits.get(serviceName);
    
    if (!circuit) {
      const defaultConfig: CircuitBreakerConfig = {
        failureThreshold: 5,
        successThreshold: 3,
        timeout: 60000, // 60 seconds
        monitoringPeriod: 300000, // 5 minutes
        ...config,
      };
      
      circuit = new CircuitBreaker(serviceName, defaultConfig, this.loggingService);
      this.circuits.set(serviceName, circuit);
      
      this.logger.log(`Created circuit breaker for service: ${serviceName}`);
    }
    
    return circuit;
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(
    serviceName: string,
    operation: () => Promise<T>,
    context: LogContext,
    config?: Partial<CircuitBreakerConfig>
  ): Promise<T> {
    const circuit = this.getCircuit(serviceName, config);
    return circuit.execute(operation, context);
  }

  /**
   * Get statistics for all circuit breakers
   */
  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    
    for (const [serviceName, circuit] of this.circuits.entries()) {
      stats[serviceName] = circuit.getStats();
    }
    
    return stats;
  }

  /**
   * Force open a circuit breaker
   */
  forceOpen(serviceName: string): boolean {
    const circuit = this.circuits.get(serviceName);
    if (circuit) {
      circuit.forceOpen();
      return true;
    }
    return false;
  }

  /**
   * Force close a circuit breaker
   */
  forceClose(serviceName: string): boolean {
    const circuit = this.circuits.get(serviceName);
    if (circuit) {
      circuit.forceClose();
      return true;
    }
    return false;
  }

  /**
   * Reset a circuit breaker
   */
  reset(serviceName: string): boolean {
    const circuit = this.circuits.get(serviceName);
    if (circuit) {
      circuit.reset();
      return true;
    }
    return false;
  }
}

export class CircuitBreaker {
  private state = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private totalCalls = 0;
  private lastFailureTime: Date | null = null;
  private nextAttemptTime: Date | null = null;
  private readonly startTime = new Date();

  constructor(
    private readonly serviceName: string,
    private readonly config: CircuitBreakerConfig,
    private readonly loggingService: LoggingService
  ) {}

  /**
   * Execute operation with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>, context: LogContext): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.moveToHalfOpen(context);
      } else {
        const error = new Error(`Circuit breaker is OPEN for service: ${this.serviceName}`);
        this.logCircuitBreakerEvent('circuit_open_rejected', context);
        throw error;
      }
    }

    this.totalCalls++;
    const startTime = Date.now();

    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      
      this.onSuccess(context, duration);
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.onFailure(error as Error, context, duration);
      throw error;
    }
  }

  /**
   * Handle successful operation
   */
  private onSuccess(context: LogContext, duration: number): void {
    this.successCount++;
    
    this.loggingService.logPerformanceMetrics(
      {
        ...context,
        component: 'circuit-breaker',
        metadata: { 
          ...context.metadata, 
          serviceName: this.serviceName,
          circuitState: this.state,
        },
      },
      { duration }
    );

    if (this.state === CircuitState.HALF_OPEN) {
      if (this.successCount >= this.config.successThreshold) {
        this.moveToClose(context);
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on successful operation
      this.failureCount = 0;
    }
  }

  /**
   * Handle failed operation
   */
  private onFailure(error: Error, context: LogContext, duration: number): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    this.loggingService.logExecutionError(
      {
        ...context,
        component: 'circuit-breaker',
        metadata: { 
          ...context.metadata, 
          serviceName: this.serviceName,
          circuitState: this.state,
          failureCount: this.failureCount,
        },
      },
      error,
      duration
    );

    if (this.state === CircuitState.HALF_OPEN) {
      this.moveToOpen(context);
    } else if (this.state === CircuitState.CLOSED && 
               this.failureCount >= this.config.failureThreshold) {
      this.moveToOpen(context);
    }
  }

  /**
   * Move to OPEN state
   */
  private moveToOpen(context: LogContext): void {
    this.state = CircuitState.OPEN;
    this.nextAttemptTime = new Date(Date.now() + this.config.timeout);
    
    this.logCircuitBreakerEvent('circuit_opened', context);
    
    if (this.config.onOpen) {
      this.config.onOpen();
    }
  }

  /**
   * Move to HALF_OPEN state
   */
  private moveToHalfOpen(context: LogContext): void {
    this.state = CircuitState.HALF_OPEN;
    this.successCount = 0;
    
    this.logCircuitBreakerEvent('circuit_half_opened', context);
    
    if (this.config.onHalfOpen) {
      this.config.onHalfOpen();
    }
  }

  /**
   * Move to CLOSED state
   */
  private moveToClose(context: LogContext): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttemptTime = null;
    
    this.logCircuitBreakerEvent('circuit_closed', context);
    
    if (this.config.onClose) {
      this.config.onClose();
    }
  }

  /**
   * Check if circuit should attempt reset
   */
  private shouldAttemptReset(): boolean {
    return this.nextAttemptTime !== null && 
           new Date() >= this.nextAttemptTime;
  }

  /**
   * Log circuit breaker state changes
   */
  private logCircuitBreakerEvent(event: string, context: LogContext): void {
    this.loggingService.logSecurityEvent(
      `Circuit breaker ${event}: ${this.serviceName}`,
      {
        ...context,
        component: 'circuit-breaker',
        metadata: {
          ...context.metadata,
          serviceName: this.serviceName,
          event,
          state: this.state,
          failureCount: this.failureCount,
          successCount: this.successCount,
        },
      },
      'medium'
    );
  }

  /**
   * Get circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalCalls: this.totalCalls,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
      uptime: Date.now() - this.startTime.getTime(),
    };
  }

  /**
   * Force circuit to OPEN state
   */
  forceOpen(): void {
    this.state = CircuitState.OPEN;
    this.nextAttemptTime = new Date(Date.now() + this.config.timeout);
  }

  /**
   * Force circuit to CLOSED state
   */
  forceClose(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttemptTime = null;
  }

  /**
   * Reset circuit breaker statistics
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.totalCalls = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
  }
}
