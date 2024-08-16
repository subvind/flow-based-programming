import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import { CustomLogger } from './logger/custom-logger';

import { bootstrapMicroservice } from './bootstrap/microservice.bootstrap';
import { bootstrapApp } from './bootstrap/app.bootstrap';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const logger = new CustomLogger('Bootstrap', app.get('FLOW_SERVICE'));
  
  const microservice = await bootstrapMicroservice(logger);
  const mainApp = await bootstrapApp(logger);

  process.on('SIGINT', async () => {
    CustomLogger.clearLogFile();
    await microservice.close();
    await mainApp.close();
    process.exit();
  });
}

bootstrap().catch((error) => {
  console.log('Bootstrap error:', error)
  process.exit(1);
});