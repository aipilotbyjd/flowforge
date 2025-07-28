import { Module, Global } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ObservabilityLoggingModule } from '@flowforge/observability-logging';
import { ErrorHandlerService } from './error-handler.service';
import { CircuitBreakerService } from './circuit-breaker.service';
import { ExecutionMonitorService } from './execution-monitor.service';
import { MonitoringController } from './monitoring.controller';

@Global()
@Module({
  imports: [
    ScheduleModule.forRoot(),
    ObservabilityLoggingModule,
  ],
  controllers: [
    MonitoringController,
  ],
  providers: [
    ErrorHandlerService,
    CircuitBreakerService,
    ExecutionMonitorService,
  ],
  exports: [
    ErrorHandlerService,
    CircuitBreakerService,
    ExecutionMonitorService,
  ],
})
export class ObservabilityMonitoringModule {}
