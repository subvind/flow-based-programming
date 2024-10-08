import { NestFactory } from '@nestjs/core';
import { AppModule } from '../modules/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';
import { FlowExecutorService } from '../services/flow-executor.service';
import { CustomLogger } from '../logger/custom-logger';
import { resolve } from 'path';
import { initializeFlows } from '../initializers/flows.initialize';

export async function bootstrapApp(logger: CustomLogger): Promise<any> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger });
  
  app.useStaticAssets(resolve('./src/public'));
  app.setBaseViewsDir(resolve('./src/views'));
  app.setViewEngine('ejs');

  app.use(cookieParser());

  // so browsers can use api
  app.enableCors({
    origin: '*',
  });

  const flowExecutor = app.get(FlowExecutorService);

  await app.init();

  logger.log('Starting flow execution...');
  await initializeFlows(flowExecutor);

  await app.listen(3000);
  logger.log('Application is running on: http://localhost:3000');

  return app;
}