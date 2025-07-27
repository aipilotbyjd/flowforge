import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const logger = new Logger('NodeExecutor');
  
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  const configService = app.get(ConfigService);
  const port = configService.get('NODE_EXECUTOR_PORT', 3002);
  const globalPrefix = 'api/v1';

  // Security & Middleware
  app.enableCors({
    origin: configService.get('ALLOWED_ORIGINS', '*'),
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // API Documentation
  const config = new DocumentBuilder()
    .setTitle('FlowForge Node Executor API')
    .setDescription('Distributed node execution workers for workflow processing')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' }, 'api-key')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  app.setGlobalPrefix(globalPrefix);

  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 Node Executor is running on: http://localhost:${port}/${globalPrefix}`);
  logger.log(`📚 API Documentation: http://localhost:${port}/docs`);
}

bootstrap().catch((error) => {
  Logger.error('Failed to start Node Executor', error);
  process.exit(1);
});
