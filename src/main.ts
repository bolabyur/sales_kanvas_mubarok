import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();

  app.useGlobalPipes(new ZodValidationPipe());
  // Nest mencocokkan filter global dari yang TERAKHIR didaftarkan, jadi
  // catch-all AllExceptionsFilter (juga menangani ZodValidationException)
  // harus PERTAMA, PrismaExceptionFilter yang spesifik sesudahnya.
  app.useGlobalFilters(new AllExceptionsFilter(), new PrismaExceptionFilter());

  await app.listen(process.env.PORT ?? 53103);
}
bootstrap();
