import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import { CustomLogger } from './logger/custom-logger';
import { bootstrapApp } from './bootstrap/app.bootstrap';
import { EventEmitter } from 'events';

async function bootstrap(): Promise<void> {
  // Increase the maximum number of listeners
  EventEmitter.defaultMaxListeners = 100;

  const app = await NestFactory.create(AppModule);
  
  // Create the CustomLogger
  const logger = new CustomLogger('Bootstrap');
  
  try {
    logger.log('Starting main application...');
    const mainApp = await bootstrapApp(logger);

    process.on('SIGINT', async () => {
      CustomLogger.clearSTDOUT();
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