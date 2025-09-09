import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { LoggerService } from './common/services/logger.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new LoggerService(),
    rawBody: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 8081;

  // Enable CORS
  app.enableCors({
    origin: true,
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

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Renamie API')
    .setDescription('The Renamie API description')
    .setVersion('1.0')
    .addTag('renamie')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(port);

  const logger = app.get(LoggerService);
  logger.log(`Application is running on: http://localhost:${port}`, 'Bootstrap');
  logger.log(`Environment: ${configService.get<string>('nodeEnv')}`, 'Bootstrap');
}
bootstrap();
