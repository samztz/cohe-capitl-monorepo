import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import fastifyCors from '@fastify/cors';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const adapter = new FastifyAdapter();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    adapter,
    { bufferLogs: true },
  );

  // Enable pino logger
  app.useLogger(app.get(Logger));

  // Register CORS plugin with Fastify
  await app.register(fastifyCors, {
    origin: process.env.CORS_ORIGIN ?? '*',
    credentials: true,
  });

  const port = Number(process.env.PORT ?? 3001);
  const host = process.env.HOST ?? '0.0.0.0';
  const shouldListen = process.env.SKIP_LISTEN !== '1';

  if (shouldListen) {
    await app.listen(port, host);
    app.get(Logger).log(`🚀 API listening on http://${host}:${port}`);
    return;
  }

  await app.init();
}

void bootstrap();
