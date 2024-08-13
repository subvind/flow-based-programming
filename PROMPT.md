Please follow the instructions within ./TODO.md! Thank you :)
### ./src/components/base.component.ts
```ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { Component } from '../interfaces/component.interface';

@Injectable()
export abstract class ComponentService implements Component {
  @Inject('FLOW_SERVICE')
  protected client: ClientProxy;
  public readonly logger = new Logger(ComponentService.name);

  constructor(
    public id: string,
    public name: string,
    public description: string
  ) {
    this.client = ClientProxyFactory.create({
      transport: Transport.REDIS,
      options: {
        url: 'redis://localhost:6379',
      },
    });

    this.client.connect().then(() => {
      this.logger.log('Connected to Redis successfully');
    }).catch(err => {
      this.logger.error('Failed to connect to Redis', err);
    });
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
import { Injectable, Logger } from '@nestjs/common';
import { ComponentService } from './base.component';

@Injectable()
export class NumberGeneratorComponent extends ComponentService {
  constructor() {
    super('numberGenerator', 'Number Generator', 'Generates random numbers periodically');
  }

  async handleEvent(eventName: string, data: any): Promise<void> {
    this.logger.log(`Handling event: ${eventName}`);
    if (eventName === 'start') {
      this.logger.log('Starting number generation');
      setInterval(() => {
        const randomNumber = Math.random();
        this.logger.log(`Emitting numberGenerated event: ${randomNumber}`);
        this.emitEvent('numberGenerated', randomNumber);
      }, 1000);
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

  constructor(private componentRegistry: ComponentRegistry) {}

  @EventPattern('componentEvent')
  async handleComponentEvent(@Payload() data: {componentId: string, eventName: string, data: any}) {
    console.log('test1')
    const { componentId, eventName, data: eventData } = data;
    this.logger.log(`Received componentEvent: ${componentId}.${eventName}, data: ${JSON.stringify(eventData)}`);
    const component = this.componentRegistry.getComponent(componentId);
    if (component) {
      this.logger.log(`Passing event to component: ${componentId}`);
      await component.handleEvent(eventName, eventData);
    } else {
      this.logger.warn(`Component not found: ${componentId}`);
    }
  }

  @EventPattern('createConnection')
  async createConnection(@Payload() data: {fromComponent: string, fromEvent: string, toComponent: string, toEvent: string}) {

    console.log('test2')
    const { fromComponent, fromEvent, toComponent, toEvent } = data;
    this.logger.log(`Received createConnection: ${fromComponent}.${fromEvent} -> ${toComponent}.${toEvent}`);
    // Implement connection logic here
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
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ComponentRegistry } from './component-registry.service';
import { Flow } from '../interfaces/flow.interface';

@Injectable()
export class FlowExecutorService {
  @Inject('FLOW_SERVICE')
  private client: ClientProxy;
  private readonly logger = new Logger(FlowExecutorService.name);

  constructor(private componentRegistry: ComponentRegistry) {
    this.client = ClientProxyFactory.create({
      transport: Transport.REDIS,
      options: {
        url: 'redis://localhost:6379',
      },
    });

    this.client.connect().then(() => {
      this.logger.log('Connected to Redis successfully');
    }).catch(err => {
      this.logger.error('Failed to connect to Redis', err);
    });
  }

  async executeFlow(flow: Flow) {
    this.logger.log(`Executing flow: ${flow.id}`);
    for (const connection of flow.connections) {
      this.logger.log(`Creating connection: ${connection.fromComponent}.${connection.fromEvent} -> ${connection.toComponent}.${connection.toEvent}`);
      await this.client.emit('createConnection', connection).toPromise();
    }

    for (const component of flow.components) {
      const componentInstance = this.componentRegistry.getComponent(component.componentId);
      if (componentInstance) {
        this.logger.log(`Starting component: ${component.componentId}`);
        await this.client.emit('componentEvent', {
          componentId: component.componentId,
          eventName: 'start',
          data: null,
        }).toPromise();
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

```

### ./CURRENT_ERROR.md
```md
[7:47:04 PM] File change detected. Starting incremental compilation...

[7:47:04 PM] Found 0 errors. Watching for file changes.

[Nest] 10321  - 08/12/2024, 7:47:05 PM     LOG [NestFactory] Starting Nest application...
[Nest] 10321  - 08/12/2024, 7:47:05 PM     LOG [InstanceLoader] ClientsModule dependencies initialized +77ms
[Nest] 10321  - 08/12/2024, 7:47:05 PM     LOG [InstanceLoader] AppModule dependencies initialized +2ms
[Nest] 10321  - 08/12/2024, 7:47:05 PM     LOG [ComponentRegistry] Registering component: numberGenerator
[Nest] 10321  - 08/12/2024, 7:47:05 PM     LOG [ComponentRegistry] Registering component: numberMultiplier
[Nest] 10321  - 08/12/2024, 7:47:05 PM     LOG [ComponentService] Connected to Redis successfully
[Nest] 10321  - 08/12/2024, 7:47:05 PM     LOG [ComponentService] Connected to Redis successfully
[Nest] 10321  - 08/12/2024, 7:47:05 PM     LOG [FlowExecutorService] Connected to Redis successfully
[Nest] 10321  - 08/12/2024, 7:47:05 PM     LOG [NestMicroservice] Nest microservice successfully started +1ms
[Nest] 10321  - 08/12/2024, 7:47:05 PM     LOG [BootstrapMicroservice] Microservice is now listening for Redis events
[Nest] 10321  - 08/12/2024, 7:47:06 PM     LOG [NestFactory] Starting Nest application... +151ms
[Nest] 10321  - 08/12/2024, 7:47:06 PM     LOG [InstanceLoader] ClientsModule dependencies initialized +10ms
[Nest] 10321  - 08/12/2024, 7:47:06 PM     LOG [InstanceLoader] AppModule dependencies initialized +1ms
[Nest] 10321  - 08/12/2024, 7:47:06 PM     LOG [ComponentRegistry] Registering component: numberGenerator
[Nest] 10321  - 08/12/2024, 7:47:06 PM     LOG [ComponentRegistry] Registering component: numberMultiplier
[Nest] 10321  - 08/12/2024, 7:47:06 PM     LOG [NestApplication] Nest application successfully started +1ms
[Nest] 10321  - 08/12/2024, 7:47:06 PM     LOG [BootstrapMain] Registered component: numberGenerator
[Nest] 10321  - 08/12/2024, 7:47:06 PM     LOG [BootstrapMain] Registered component: numberMultiplier
[Nest] 10321  - 08/12/2024, 7:47:06 PM     LOG [BootstrapMain] Starting flow execution...
[Nest] 10321  - 08/12/2024, 7:47:06 PM     LOG [FlowExecutorService] Executing flow: example-flow
[Nest] 10321  - 08/12/2024, 7:47:06 PM     LOG [FlowExecutorService] Creating connection: gen1.numberGenerated -> mult1.numberReceived
[Nest] 10321  - 08/12/2024, 7:47:06 PM     LOG [ComponentService] Connected to Redis successfully
[Nest] 10321  - 08/12/2024, 7:47:06 PM     LOG [ComponentService] Connected to Redis successfully
[Nest] 10321  - 08/12/2024, 7:47:06 PM     LOG [FlowExecutorService] Connected to Redis successfully
[Nest] 10321  - 08/12/2024, 7:47:06 PM     LOG [FlowExecutorService] Starting component: numberGenerator
[Nest] 10321  - 08/12/2024, 7:47:06 PM     LOG [FlowExecutorService] Starting component: numberMultiplier
[Nest] 10321  - 08/12/2024, 7:47:06 PM     LOG [BootstrapMain] Application is running on: http://localhost:3000
```

### ./TODO.md
```md
after todo: i will update my code base with the submitted files and run the program ... if there is an error then it will be placed within ./CURRENT_ERROR.md otherwise assume i have updated my requirements.

durring todo: if there is an error within ./CURRENT_ERROR.md then help me solve that otherwise don't worry about it and proceed with the following todo rules.

TODO RULES:
- return a ./src/.js file(s)
- i'd like TypeScript in response to my queries!
- keep logger for debugging
- keep code comments for documentation
```

