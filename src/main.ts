import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import { CustomLogger } from './logger/custom-logger';

import { bootstrapMicroservice } from './bootstrap/microservice.bootstrap';
import { bootstrapApp } from './bootstrap/app.bootstrap';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const logger = new CustomLogger('Bootstrap', app.get('FLOW_SERVICE'));
  
  try {
    logger.log('Starting microservice...');
    const microservice = await bootstrapMicroservice(logger);
    
    logger.log('Waiting for microservice to fully start...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    logger.log('Starting main application...');
    const mainApp = await bootstrapApp(logger);

    process.on('SIGINT', async () => {
      CustomLogger.clearSTDOUT();
      await microservice.close();
      await mainApp.close();
      process.exit();
    });
  } catch (error) {
    logger.error(`Bootstrap error: ${error.message}`, error.stack);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('Unhandled bootstrap error:', error);
  process.exit(1);
});