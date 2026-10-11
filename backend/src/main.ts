import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { csrfProtection } from './csrf.js';
import { setupSession } from './session.js';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    throw new Error('SESSION_SECRET must contain at least 32 characters');
  }
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  await setupSession(app);
  app.use(csrfProtection);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
    exposedHeaders: ['x-csrf-token'],
  });
  await app.listen(Number(process.env.PORT ?? 3000));
}
await bootstrap();
