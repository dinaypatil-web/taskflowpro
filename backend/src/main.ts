import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { FirestoreExceptionFilter } from './shared/firestore/firestore-exception.filter';

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';

  // Winston logger configuration — console-only in production to avoid
  // file-system write failures on containerized platforms like Railway.
  const transports: winston.transport[] = [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  ];

  // Only add file transports in development where the filesystem is writable
  if (!isProduction) {
    transports.push(
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    );
  }

  const logger = WinstonModule.createLogger({ transports });

  const app = await NestFactory.create(AppModule, {
    logger,
  });

  const configService = app.get(ConfigService);

  // Security middleware
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  // CORS configuration — allow multiple origins for flexibility
  const frontendUrl = configService.get('FRONTEND_URL', 'http://localhost:3000');
  app.enableCors({
    origin: [frontendUrl, 'http://localhost:3000'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Firestore specific error handling
  app.useGlobalFilters(new FirestoreExceptionFilter());

  // Swagger documentation
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('TaskFlow Pro API')
      .setDescription('Professional task scheduler and reminder platform API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = configService.get('PORT', 3001);

  // Explicitly listen on 0.0.0.0 for deployment platforms (like Railway)
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 TaskFlow Pro API is running on port ${port}`);
  logger.log(`📄 Environment: ${isProduction ? 'production' : 'development'}`);
}

// Global error handling outside bootstrap to catch initialization errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
  process.exit(1);
});

bootstrap().catch((err) => {
  console.error('Fatal error during bootstrap:', err);
  process.exit(1);
});
