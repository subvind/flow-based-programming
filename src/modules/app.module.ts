import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ComponentRegistry } from '../services/component-registry.service';
import { FlowExecutorService } from '../services/flow-executor.service';
import { EventProcessor } from '../processors/event.processor';
import { CustomLogger } from '../logger/custom-logger';
import { AppController } from '../controllers/app.controller';
import { TemplateCacheService } from 'src/services/template-cache.service';
import { BackplaneService } from '../services/backplane.service';

import { initializeAppModule, components } from '../initializers/app.initialize';

const rabbitmqUri = process.env.RABBITMQ || 'amqp://localhost:5672';
console.log(`[AppModule] RabbitMQ URI: ${rabbitmqUri}`);

const metadata = {
  imports: [
    RabbitMQModule.forRoot(RabbitMQModule, {
      exchanges: [
        {
          name: 'flow_exchange',
          type: 'topic',
        },
      ],
      uri: rabbitmqUri,
      connectionInitOptions: { wait: false },
    }),
  ],
  controllers: [AppController],
  providers: [
    EventProcessor,
    ComponentRegistry,
    FlowExecutorService,
    TemplateCacheService,
    BackplaneService,
    {
      provide: 'BACKPLANE',
      useFactory: (backplaneService: BackplaneService) => {
        return () => backplaneService.onModuleInit();
      },
      inject: [BackplaneService],
      multi: true,
    },
    {
      provide: 'FLOW_ID',
      useValue: 'example-flow', // Use a default flow ID
    },
    {
      provide: 'COMPONENT_ID',
      useFactory: () => `component-${Date.now()}`, // Generate a unique component ID
    },
    {
      provide: 'WEB_SOCKET_SERVER',
      useValue: null, // This will be set later in the FlowExecutorService
    },
    {
      provide: 'TEMPLATES',
      useValue: null, // This will be set later (?)
    },
    ...components,
    CustomLogger
  ],
  exports: [EventProcessor],
}

export const AppModule = initializeAppModule(metadata)