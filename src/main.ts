import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import { FlowExecutorService } from './services/flow-executor.service';
import { Flow } from './interfaces/flow.interface';
import { ComponentRegistry } from './services/component-registry.service';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { CustomLogger } from './logger/custom-logger';
import { EventProcessor } from './processors/event.processor';
import { Component } from './interfaces/component.interface';

async function bootstrapMicroservice(logger: CustomLogger): Promise<any> {
  const microservice = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.TCP,
    options: {
      host: 'localhost',
      port: 3001,
    },
    logger,
  });

  await microservice.listen();
  logger.log('Microservice is now listening for TCP events on port 3001');

  return microservice;
}

async function bootstrapApp(logger: CustomLogger): Promise<any> {
  const app = await NestFactory.create(AppModule, { logger });

  const flowExecutor = app.get(FlowExecutorService);
  const componentRegistry = app.get(ComponentRegistry);

  await app.init();

  const exampleFlow: Flow = {
    id: 'example-flow',
    components: [
      { id: 'gen1', componentId: 'numberGenerator' },
      { id: 'mult1', componentId: 'numberMultiplier' },
    ],
    connections: [
      {
        fromComponent: 'gen1',
        fromEvent: 'numberGenerated',
        toComponent: 'mult1',
        toEvent: 'numberReceived',
      },
    ],
  };

  logger.log('Starting flow execution...');
  await flowExecutor.executeFlow(exampleFlow);

  await app.listen(3000);
  logger.log('Application is running on: http://localhost:3000');

  return app;
}

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