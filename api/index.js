const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');
const { DocumentBuilder, SwaggerModule } = require('@nestjs/swagger');

let app;

async function createApp() {
  if (!app) {
    // Import the compiled modules
    const { AppModule } = require('../dist/app.module');
    const { LoggerService } = require('../dist/common/services/logger.service');
    
    app = await NestFactory.create(AppModule, {
      logger: new LoggerService(),
      rawBody: true,
    });

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

    await app.init();
  }
  return app;
}

module.exports = async (req, res) => {
  try {
    const nestApp = await createApp();
    const server = nestApp.getHttpAdapter().getInstance();
    return server(req, res);
  } catch (error) {
    console.error('Error in Vercel handler:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
