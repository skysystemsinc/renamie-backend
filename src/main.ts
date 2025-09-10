import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { LoggerService } from './common/services/logger.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

let server: any;

async function createApp() {
  const app = await NestFactory.create(AppModule, {
    logger: new LoggerService(),
    rawBody: true,
  });

  const configService = app.get(ConfigService);

  app.enableCors({
    origin: true,
    credentials: true,
  });

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

  // ⚡ Remove global prefix for Vercel (all routes root-mounted)
  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('Renamie API')
    .setDescription('The Renamie API description')
    .setVersion('1.0')
    .addTag('renamie')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory);

  return { app, configService };
}

export default async function handler(req: any, res: any) {
  if (!server) {
    const { app } = await createApp();
    await app.init(); // don’t call `listen` in Vercel
    server = app.getHttpAdapter().getInstance();
  }
  return server(req, res);
}

// ✅ Only run local bootstrap when not on Vercel
if (!process.env.VERCEL) {
  (async () => {
    const { app, configService } = await createApp();
    const port = configService.get<number>('port') || 8081;
    await app.listen(port);
    console.log(`App running locally on http://localhost:${port}`);
  })();
}
