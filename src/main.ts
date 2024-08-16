import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import { FlowExecutorService } from './services/flow-executor.service';
import { Flow } from './interfaces/flow.interface';
import { ComponentRegistry } from './services/component-registry.service';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { EventProcessor } from './processors/event.processor';
import { Component } from './interfaces/component.interface';

async function bootstrapMicroservice() {
  const logger = new Logger('BootstrapMicroservice');

  const microservice = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.REDIS,
    options: {
      host: 'localhost',
    },
  });

  await microservice.listen();
  logger.log('Microservice is now listening for Redis events');

  return microservice;
}

async function bootstrapApp() {
  const logger = new Logger('BootstrapMain');

  const app = await NestFactory.create(AppModule);

  const flowExecutor = app.get(FlowExecutorService);
  const componentRegistry = app.get(ComponentRegistry);

  await app.init();

  // const components = componentRegistry.getAllComponents();
  // components.forEach(component => {
  //   logger.log(`Registered component: ${component.id}`);
  //   wrapComponentEmitEvent(component, logger);
  // });

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

// function wrapComponentEmitEvent(component: Component, logger: Logger) {
//   const originalEmitEvent = component.emitEvent.bind(component);
//   component.emitEvent = async (eventName: string, data: any) => {
//     logger.log(`${component.id} emitting event: ${eventName}, data: ${JSON.stringify(data)}`);
//     return originalEmitEvent(eventName, data);
//   };
// }

async function bootstrap() {
  const microservice = await bootstrapMicroservice();
  const app = await bootstrapApp();

  process.on('SIGINT', async () => {
    await microservice.close();
    await app.close();
    process.exit();
  });
}

bootstrap();