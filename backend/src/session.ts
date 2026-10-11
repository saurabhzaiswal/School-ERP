import session from 'express-session';
import { RedisStore } from 'connect-redis';
import { createClient } from 'redis';
import type { INestApplication } from '@nestjs/common';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

export async function setupSession(app: INestApplication) {
  const client = createClient({
    url: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
  });
  client.on('error', (error) => console.error('Redis session error:', error));
  await client.connect();
  app.use(
    session({
      name: 'school_session',
      store: new RedisStore({ client, prefix: 'school:sess:' }),
      secret: process.env.SESSION_SECRET!,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 8 * 60 * 60 * 1000,
        path: '/',
      },
    }),
  );
  app.enableShutdownHooks();
  return client;
}
