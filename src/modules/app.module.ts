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