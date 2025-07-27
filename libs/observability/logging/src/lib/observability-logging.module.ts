import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggingService } from './logging.service';
import { LoggingInterceptor } from './logging.interceptor';
import { ErrorLoggingService } from './error-logging.service';

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [],
  providers: [
    LoggingService,
    LoggingInterceptor,
    ErrorLoggingService,
  ],
  exports: [
    LoggingService,
    LoggingInterceptor,
    ErrorLoggingService,
  ],
})
export class ObservabilityLoggingModule {}
