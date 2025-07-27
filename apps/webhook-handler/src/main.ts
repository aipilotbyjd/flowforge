import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const logger = new Logger('WebhookHandler');
  
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ 
      logger: true,
      bodyLimit: 10485760, // 10MB for webhook payloads
    }),
  );

  const configService = app.get(ConfigService);
  const port = configService.get('WEBHOOK_HANDLER_PORT', 3003);
  const globalPrefix = 'api/v1';

  // Security & Middleware
  app.enableCors({
    origin: configService.get('ALLOWED_ORIGINS', '*'),
    credentials: true,
  });

  // Validation with raw body support for webhooks
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      skipMissingProperties: true, // Allow webhooks with varying payloads
    }),
  );

  // API Documentation
  const config = new DocumentBuilder()
    .setTitle('FlowForge Webhook Handler API')
    .setDescription('HTTP trigger processing and webhook management')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' }, 'api-key')
    .addApiKey({ type: 'apiKey', name: 'X-Webhook-Secret', in: 'header' }, 'webhook-secret')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  app.setGlobalPrefix(globalPrefix);

  await app.listen(port, '0.0.0.0');
  logger.log(`🪝 Webhook Handler is running on: http://localhost:${port}/${globalPrefix}`);
  logger.log(`📚 API Documentation: http://localhost:${port}/docs`);
}

bootstrap().catch((error) => {
  Logger.error('Failed to start Webhook Handler', error);
  process.exit(1);
});
