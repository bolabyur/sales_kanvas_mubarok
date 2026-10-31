import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { json, urlencoded } from 'express';

process.on('warning', (warning) => {
  if (warning.name === 'DeprecationWarning' && warning.message.includes('client.query()')) {
    return;
  }
  console.warn(warning);
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.use(helmet());

  // === PERBAIKAN API-17: Tolak Duplikasi Authorization Header ===
  // Posisikan paling atas sebelum body parser agar langsung ditolak
  app.use((req: any, res: any, next: any) => {
    const auth = req.headers['authorization'];
    // Cek jika ada koma (indikasi duplikasi header seperti: "Bearer token1, Bearer token2")
    if (auth && typeof auth === 'string' && auth.includes(',')) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Duplikasi Authorization Header terdeteksi.",
      });
    }
    next();
  });
  // ==============================================================

  // Batasi ukuran body request (Maks 1MB) - Perbaikan DI-06
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true, limit: '1mb' }));

  const allowedOrigins = process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(',') 
    : ['http://localhost:3001'];

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, 
  });

  app.setGlobalPrefix('api');
  app.useGlobalFilters(new AllExceptionsFilter());

  const config = new DocumentBuilder()
    .setTitle('Sales Kanvas API')
    .setDescription('Dokumentasi API Sales Kanvas')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  if (process.env.NODE_ENV !== 'production') {
    SwaggerModule.setup('api/docs', app, cleanupOpenApiDoc(document));
  }

  const port = process.env.PORT || 53103;
  await app.listen(port);

  const serverUrl = await app.getUrl();
  console.log(`Application is running on: ${serverUrl}/api`);
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Swagger Docs available at: ${serverUrl}/api/docs`);
  } else {
    console.log(`Swagger disabled in production environment.`);
  }
}
bootstrap();