import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set API versioning prefix, excluding health checks
  app.setGlobalPrefix('api/v1', {
    exclude: ['health'],
  });

  // Enable CORS for frontend communication
  app.enableCors({
     origin: [
    "http://localhost:5173",
    "http://192.168.1.103:5173",
  ],
    credentials: true,
  });

  // Configure Swagger OpenAPI docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Flowcart API')
    .setDescription('The Flowcart multi-tenant POS and Merchant billing API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // Enable global exception handling filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Enable global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Enable global request validation pipeline
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port , "0.0.0.0");
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
}
bootstrap();

