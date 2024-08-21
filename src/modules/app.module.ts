import { Module, OnModuleInit } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ComponentRegistry } from '../services/component-registry.service';
import { FlowExecutorService } from '../services/flow-executor.service';
import { EventProcessor } from '../processors/event.processor';
import { NumberGeneratorComponent } from '../components/number-generator.component';
import { NumberMultiplierComponent } from '../components/number-multiplier.component';
import { EventTriggerComponent } from '../components/event-trigger.component';
import { CustomLogger } from '../logger/custom-logger';
import { AppController } from '../controllers/app.controller';

@Module({
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
    NumberGeneratorComponent,
    NumberMultiplierComponent,
    EventTriggerComponent,
    CustomLogger
  ],
  exports: [EventProcessor],
})
export class AppModule implements OnModuleInit {
  constructor(
    private componentRegistry: ComponentRegistry,
    private numberGeneratorComponent: NumberGeneratorComponent,
    private numberMultiplierComponent: NumberMultiplierComponent,
    private eventTriggerComponent: EventTriggerComponent
  ) {}

  onModuleInit() {
    // Register components
    this.componentRegistry.registerComponent(this.numberGeneratorComponent);
    this.componentRegistry.registerComponent(this.numberMultiplierComponent);
    this.componentRegistry.registerComponent(this.eventTriggerComponent);
  }
}