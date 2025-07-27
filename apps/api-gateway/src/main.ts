/**
 * FlowForge Enterprise API Gateway
 * Enterprise-grade workflow automation platform
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import {
  SwaggerModule,
  DocumentBuilder,
} from '@nestjs/swagger';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false,
      bodyLimit: 10485760, // 10MB
      requestTimeout: 30000,
      maxParamLength: 500,
    }),
    { bufferLogs: true }
  );

  const configService = app.get(ConfigService);
  
  // Security middleware
  await app.register(require('@fastify/helmet'), {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  });
  
  await app.register(require('@fastify/compress'), { encodings: ['gzip', 'deflate'] });

  // CORS configuration
  app.enableCors({
    origin: configService.get('ALLOWED_ORIGINS', '*').split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  // Swagger documentation
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('FlowForge Enterprise API')
      .setDescription('Enterprise workflow automation platform - REST API')
      .setVersion('1.0.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addApiKey(
        {
          type: 'apiKey',
          name: 'X-API-Key',
          in: 'header',
          description: 'API Key for service-to-service communication',
        },
        'API-Key',
      )
      .addTag('workflows', 'Workflow management operations')
      .addTag('executions', 'Workflow execution operations')
      .addTag('nodes', 'Node management operations')
      .addTag('auth', 'Authentication operations')
      .addTag('users', 'User management operations')
      .addTag('organizations', 'Organization management operations')
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
      },
    });
  }

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  
  // Graceful shutdown
  app.enableShutdownHooks();

  const port = configService.get('PORT', 3000);
  const host = configService.get('HOST', '0.0.0.0');
  
  await app.listen(port, host);
  
  Logger.log(
    `🚀 FlowForge API Gateway is running on: http://localhost:${port}/${globalPrefix}`
  );
  Logger.log(
    `📚 Swagger Documentation: http://localhost:${port}/${globalPrefix}/docs`
  );
  Logger.log(
    `🔍 GraphQL Playground: http://localhost:${port}/graphql` 
  );
  Logger.log(
    `⚡ Environment: ${configService.get('NODE_ENV', 'development')}`
  );
}

bootstrap().catch((error) => {
  Logger.error('Failed to start application', error);
  process.exit(1);
});
