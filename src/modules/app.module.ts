import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ComponentRegistry } from '../services/component-registry.service';
import { FlowExecutorService } from '../services/flow-executor.service';
import { EventProcessor } from '../processors/event.processor';
import { CustomLogger } from '../logger/custom-logger';
import { AppController } from '../controllers/app.controller';
import { TemplateCacheService } from 'src/services/template-cache.service';

import { initializeAppModule, components } from '../initializers/app.initialize';

const metadata = {
  imports: [
    RabbitMQModule.forRoot(RabbitMQModule, {
      exchanges: [
        {
          name: 'flow_exchange',
          type: 'topic',
        },
      ],
      uri: 'amqp://localhost:5672',
      connectionInitOptions: { wait: false },
    }),
  ],
  controllers: [AppController],
  providers: [
    EventProcessor,
    ComponentRegistry,
    FlowExecutorService,
    TemplateCacheService,
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
      useValue: null, // 
    },
    ...components,
    CustomLogger
  ],
  exports: [EventProcessor],
}

export const AppModule = initializeAppModule(metadata)