import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import fastifyCors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { join } from 'path';
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

  // Register static file serving for signature images (Demo only)
  // Production: Replace with private S3/R2 bucket + signed URLs
  await app.register(fastifyStatic, {
    root: join(process.cwd(), 'uploads'),
    prefix: '/uploads/',
  });

  // Setup Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('Cohe Capital Insurance API')
    .setDescription(
      'Web3 Insurance MVP API for decentralized insurance products. ' +
        'Supports SIWE authentication, product catalog, and policy management.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token obtained from SIWE authentication',
        in: 'header',
      },
      'JWT',
    )
    .addTag('Auth', 'Sign-In with Ethereum (SIWE/EIP-4361) authentication')
    .addTag('Products', 'Insurance product catalog (SKUs)')
    .addTag('Policy', 'Insurance policy management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    customSiteTitle: 'Cohe Capital API Docs',
    customfavIcon: 'https://docs.nestjs.com/assets/logo-small.svg',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = Number(process.env.PORT ?? 3001);
  const host = process.env.HOST ?? '0.0.0.0';
  const shouldListen = process.env.SKIP_LISTEN !== '1';

  if (shouldListen) {
    await app.listen(port, host);
    const logger = app.get(Logger);
    logger.log(`🚀 API listening on http://${host}:${port}`);
    logger.log(`📚 API Documentation: http://${host}:${port}/api-docs`);
    return;
  }

  await app.init();
}

void bootstrap();
