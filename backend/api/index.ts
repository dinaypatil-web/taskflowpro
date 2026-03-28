import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { FirestoreExceptionFilter } from '../src/shared/firestore/firestore-exception.filter';

const expressApp = express();
let cachedApp: any;

async function bootstrap() {
  if (!cachedApp) {
    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
      logger: ['error', 'warn'],
    });

    // Security middleware
    app.use(helmet());
    app.use(compression());
    app.use(cookieParser());

    // CORS configuration (you must whitelist your frontend URLs in Vercel environment vars too)
    app.enableCors({
      origin: true, // Allow all for serverless as a baseline; restrict in production by replacing with specific domains
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

    await app.init();
    cachedApp = app;
  }
}

export default async function handler(req: any, res: any) {
  try {
    await bootstrap();
    expressApp(req, res);
  } catch (error) {
    console.error('Fatal initialization error:', error);
    res.status(500).json({ statusCode: 500, message: 'Internal Server Error' });
  }
}
