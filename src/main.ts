import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import { FlowExecutorService } from './services/flow-executor.service';
import { Flow } from './interfaces/flow.interface';
import { ComponentRegistry } from './services/component-registry.service';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';

async function bootstrapMicroservice() {
  const logger = new Logger('BootstrapMicroservice');

  // Create the microservice
  const microservice = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.REDIS,
    options: {
      url: 'redis://localhost:6379',
    },
  });

  // Start the microservice
  await microservice.listen();
  logger.log('Microservice is now listening for Redis events');
}

async function bootstrapApp() {
  const logger = new Logger('BootstrapMain');

  // Create the main application
  const app = await NestFactory.create(AppModule);

  const flowExecutor = app.get(FlowExecutorService);
  const componentRegistry = app.get(ComponentRegistry);

  // Ensure components are registered before flow execution
  await app.init();

  // Log emitted events
  const components = componentRegistry.getAllComponents();
  components.forEach(component => {
    logger.log(`Registered component: ${component.id}`);
    const originalEmitEvent = component.emitEvent.bind(component);
    component.emitEvent = async (eventName: string, data: any) => {
      logger.log(`${component.id} emitted event: ${eventName}, data: ${JSON.stringify(data)}`);
      return originalEmitEvent(eventName, data);
    };
  });

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
}

async function bootstrap() {
  // Start the microservice
  await bootstrapMicroservice();

  // Start the main application
  await bootstrapApp();
}

bootstrap();
