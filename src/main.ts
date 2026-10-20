import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';

process.on('warning', (warning) => {
  if (warning.name === 'DeprecationWarning' && warning.message.includes('client.query()')) {
    return;
  }
  console.warn(warning);
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: 'http://localhost:3001',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, 
  });

  app.setGlobalPrefix('api');

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
  
  SwaggerModule.setup('api/docs', app, cleanupOpenApiDoc(document));

  await app.listen(process.env.PORT || 53103);
  console.log(`Application is running on: ${await app.getUrl()}/api`);
  console.log(`Swagger Docs available at: ${await app.getUrl()}/api/docs`);
}
bootstrap();