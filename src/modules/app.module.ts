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
      useValue: 'your-flow-id-here', // Or use a factory if it's dynamic
    },
    {
      provide: 'COMPONENT_ID',
      useValue: 'your-component-id-here', // Or use a factory if it's dynamic
    },
    {
      provide: 'WEB_SOCKET_SERVER',
      useValue: 'your-wss-here', // Or use a factory if it's dynamic
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
    // this.componentRegistry.registerComponentName(this.numberGeneratorComponent);
    // this.componentRegistry.registerComponentName(this.numberMultiplierComponent);
    // this.componentRegistry.registerComponentName(this.eventTriggerComponent);
  }
}