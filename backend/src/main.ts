import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import multipart from '@fastify/multipart';
import { AppModule } from './app.module';
async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // Register @fastify/multipart for file upload support (before routes)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await app.register(multipart as any, {
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  });

  app.enableCors();

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  // HttpExceptionFilter는 APP_FILTER(app.module.ts)로 등록 — DI 주입을 위해 main.ts에서 제거

  const swaggerConfig = new DocumentBuilder()
    .setTitle('AutoCare Copilot API')
    .setDescription('RAG 기반 자동차 고객지원 API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(port, '0.0.0.0');
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Swagger UI: http://localhost:${port}/api-docs`);
}

bootstrap();
