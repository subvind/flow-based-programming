import { Module, OnModuleInit } from '@nestjs/common';
import { ComponentRegistry } from '../services/component-registry.service';

import { NumberGeneratorComponent } from '../components/number-generator/number-generator.handler';
import { NumberMultiplierComponent } from '../components/number-multiplier/number-multiplier.handler';
import { EventTriggerComponent } from '../components/event-trigger/event-trigger.handler';

export function initializeAppModule(metadata): any {
  @Module(metadata)
  class AppModule implements OnModuleInit {
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

  return AppModule;
}

export const components = [
  NumberGeneratorComponent,
  NumberMultiplierComponent,
  EventTriggerComponent,
]