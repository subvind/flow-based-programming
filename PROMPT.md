Please follow the instructions within ./TODO.md! Thank you :)
### ./src/components/base.component.ts
```ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Component } from '../interfaces/component.interface';
import { CustomLogger } from '../logger/custom-logger';

@Injectable()
export abstract class ComponentService implements Component {
  @Inject('FLOW_SERVICE')
  protected client: ClientProxy;
  protected readonly logger: CustomLogger;

  constructor(
    public id: string,
    public name: string,
    public description: string
  ) {
    this.logger = new CustomLogger(this.id, this.client);
  }

  abstract handleEvent(eventName: string, data: any): Promise<void>;

  async emitEvent(eventName: string, data: any): Promise<void> {
    this.logger.log(`Emitting event: ${eventName}, data: ${JSON.stringify(data)}`);
    await this.client.emit('componentEvent', {
      componentId: this.id,
      eventName,
      data,
    }).toPromise();
  }
}
```

### ./src/components/number-generator.component.ts
```ts
import { Injectable } from '@nestjs/common';
import { ComponentService } from './base.component';

@Injectable()
export class NumberGeneratorComponent extends ComponentService {
  private interval: NodeJS.Timeout | null = null;

  constructor() {
    super('numberGenerator', 'Number Generator', 'Generates random numbers periodically');
  }

  async handleEvent(eventName: string, data: any): Promise<void> {
    this.logger.log(`NumberGenerator handling event: ${eventName}`);
    if (eventName === 'start') {
      this.logger.log('NumberGenerator starting number generation');
      this.startGenerating();
    } else if (eventName === 'stop') {
      this.logger.log('NumberGenerator stopping number generation');
      this.stopGenerating();
    }
  }

  private startGenerating() {
    this.logger.log('NumberGenerator startGenerating method called');
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.interval = setInterval(async () => {
      const randomNumber = Math.random();
      this.logger.log(`NumberGenerator generated number: ${randomNumber}`);
      await this.emitEvent('numberGenerated', randomNumber);
    }, 1000);
  }

  private stopGenerating() {
    this.logger.log('NumberGenerator stopGenerating method called');
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
```

### ./src/components/number-multiplier.component.ts
```ts
import { Injectable, Logger } from '@nestjs/common';
import { ComponentService } from './base.component';

@Injectable()
export class NumberMultiplierComponent extends ComponentService {
  constructor() {
    super('numberMultiplier', 'Number Multiplier', 'Multiplies received number by 2');
  }

  async handleEvent(eventName: string, data: any): Promise<void> {
    this.logger.log(`Handling event: ${eventName}`);
    if (eventName === 'numberReceived') {
      const result = data * 2;
      this.logger.log(`Emitting numberMultiplied event: ${result}`);
      await this.emitEvent('numberMultiplied', result);
    }
  }
}
```

### ./src/interfaces/component.interface.ts
```ts
export interface Component {
  id: string;
  name: string;
  description?: string;
  handleEvent: (eventName: string, data: any) => Promise<void>;
  emitEvent: (eventName: string, data: any) => Promise<void>;
}
```

### ./src/interfaces/flow.interface.ts
```ts
export interface Flow {
  id: string;
  components: {
    id: string;
    componentId: string;
  }[];
  connections: {
    fromComponent: string;
    fromEvent: string;
    toComponent: string;
    toEvent: string;
  }[];
}
```

### ./src/modules/app.module.ts
```ts
import { Module, OnModuleInit } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ComponentRegistry } from '../services/component-registry.service';
import { FlowExecutorService } from '../services/flow-executor.service';
import { EventProcessor } from '../processors/event.processor';
import { NumberGeneratorComponent } from '../components/number-generator.component';
import { NumberMultiplierComponent } from '../components/number-multiplier.component';
import { CustomLogger } from '../logger/custom-logger';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'FLOW_SERVICE',
        transport: Transport.REDIS,
        options: {
          url: 'redis://localhost:6379',
        },
      },
    ]),
  ],
  providers: [
    EventProcessor,
    ComponentRegistry,
    FlowExecutorService,
    NumberGeneratorComponent,
    NumberMultiplierComponent,
    CustomLogger
  ],
  exports: [EventProcessor],
})
export class AppModule implements OnModuleInit {
  constructor(
    private componentRegistry: ComponentRegistry,
    private numberGeneratorComponent: NumberGeneratorComponent,
    private numberMultiplierComponent: NumberMultiplierComponent
  ) {}

  onModuleInit() {
    this.componentRegistry.registerComponent(this.numberGeneratorComponent);
    this.componentRegistry.registerComponent(this.numberMultiplierComponent);
  }
}
```

### ./src/processors/event.processor.ts
```ts
import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ComponentRegistry } from '../services/component-registry.service';

@Controller()
export class EventProcessor {
  private readonly logger = new Logger(EventProcessor.name);
  private connections: Map<string, { toComponent: string; toEvent: string }> = new Map();

  constructor(private componentRegistry: ComponentRegistry) {}

  @EventPattern('componentEvent')
  async handleComponentEvent(@Payload() data: {componentId: string, eventName: string, data: any}) {
    const { componentId, eventName, data: eventData } = data;
    this.logger.log(`Received componentEvent: ${componentId}.${eventName}, data: ${JSON.stringify(eventData)}`);
    
    if (eventName === 'logger') {
      const { level, message } = eventData;
      this.logger.log(`Log from ${componentId}: [${level}] ${message}`);
      return;
    }
    
    const component = this.componentRegistry.getComponent(componentId);
    if (component) {
      this.logger.log(`Passing event to component: ${componentId}`);
      await component.handleEvent(eventName, eventData);

      // Check if there's a connection for this event
      const connectionKey = `${componentId}.${eventName}`;
      const connection = this.connections.get(connectionKey);
      if (connection) {
        const { toComponent, toEvent } = connection;
        this.logger.log(`Forwarding event to ${toComponent}.${toEvent}`);
        const targetComponent = this.componentRegistry.getComponent(toComponent);
        if (targetComponent) {
          await targetComponent.handleEvent(toEvent, eventData);
        } else {
          this.logger.warn(`Target component not found: ${toComponent}`);
        }
      }
    } else {
      this.logger.warn(`Component not found: ${componentId}`);
    }
  }

  @EventPattern('createConnection')
  async createConnection(@Payload() data: {fromComponent: string, fromEvent: string, toComponent: string, toEvent: string}) {
    const { fromComponent, fromEvent, toComponent, toEvent } = data;
    this.logger.log(`Received createConnection: ${fromComponent}.${fromEvent} -> ${toComponent}.${toEvent}`);
    
    const connectionKey = `${fromComponent}.${fromEvent}`;
    this.connections.set(connectionKey, { toComponent, toEvent });
    this.logger.log(`Connection created: ${connectionKey} -> ${toComponent}.${toEvent}`);
  }
}
```

### ./src/services/component-registry.service.ts
```ts
import { Injectable, Logger } from '@nestjs/common';
import { Component } from '../interfaces/component.interface';

@Injectable()
export class ComponentRegistry {
  private components: Map<string, Component> = new Map();
  private readonly logger = new Logger(ComponentRegistry.name);

  registerComponent(component: Component) {
    this.logger.log(`Registering component: ${component.id}`);
    this.components.set(component.id, component);
  }

  getComponent(id: string): Component | undefined {
    const component = this.components.get(id);
    if (!component) {
      this.logger.warn(`Component not found: ${id}`);
    }
    return component;
  }

  getAllComponents(): Component[] {
    return Array.from(this.components.values());
  }
}
```

### ./src/services/flow-executor.service.ts
```ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ComponentRegistry } from './component-registry.service';
import { Flow } from '../interfaces/flow.interface';

@Injectable()
export class FlowExecutorService {
  private readonly logger = new Logger(FlowExecutorService.name);

  constructor(
    @Inject('FLOW_SERVICE') private client: ClientProxy,
    private componentRegistry: ComponentRegistry
  ) {}

  async executeFlow(flow: Flow) {
    this.logger.log(`Executing flow: ${flow.id}`);

    // Create connections
    for (const connection of flow.connections) {
      this.logger.log(`Creating connection: ${connection.fromComponent}.${connection.fromEvent} -> ${connection.toComponent}.${connection.toEvent}`);
      await this.client.emit('createConnection', connection).toPromise();
    }

    // Start components
    for (const component of flow.components) {
      const componentInstance = this.componentRegistry.getComponent(component.componentId);
      if (componentInstance) {
        this.logger.log(`Starting component: ${component.componentId}`);
        try {
          await this.client.emit('componentEvent', {
            componentId: component.componentId,
            eventName: 'start',
            data: null,
          }).toPromise();
        } catch (error) {
          this.logger.error(`Error starting component ${component.componentId}:`, error);
        }
      } else {
        this.logger.warn(`Component not found: ${component.componentId}`);
      }
    }
  }
}
```

### ./src/main.ts
```ts
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
      url: 'redis://localhost:6379',
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
```

### ./CURRENT_ERROR.md
```md
implement an eventTrigger component that sends and receives htmx over websocket.

```

### ./TODO.md
```md
after todo: i will update my code base with the submitted files and run the program ... if there is an error then it will be placed within ./CURRENT_ERROR.md otherwise assume i have updated my requirements.

durring todo: if there is an error within ./CURRENT_ERROR.md then help me solve that otherwise don't worry about it and proceed with the following todo rules.

TODO RULES:
- return a ./src/.ts file(s)
- i'd like TypeScript in response to my queries!
- keep logger for debugging
- keep code comments for documentation
```

