import { Module, OnModuleInit } from '@nestjs/common';
import { ComponentRegistry } from '../services/component-registry.service';

import { NumberGeneratorComponent } from '../components/number-generator/number-generator.handler';
import { NumberMultiplierComponent } from '../components/number-multiplier/number-multiplier.handler';
import { EventTriggerComponent } from '../components/event-trigger/event-trigger.handler';
import { StateMachineComponent } from '../components/state-machine/state-machine.handler';
import { JobStateMachineComponent } from '../components/job-state-machine/job-state-machine.handler';

export function initializeAppModule(metadata): any {
  @Module(metadata)
  class AppModule implements OnModuleInit {
    constructor(
      private componentRegistry: ComponentRegistry,
      private eventTriggerComponent: EventTriggerComponent,
      private numberGeneratorComponent: NumberGeneratorComponent,
      private numberMultiplierComponent: NumberMultiplierComponent,
      private stateMachineComponent: StateMachineComponent,
      private jobJtateMachineComponent: JobStateMachineComponent,
    ) {}

    onModuleInit() {
      // Register components
      this.componentRegistry.registerComponent(this.eventTriggerComponent);
      this.componentRegistry.registerComponent(this.numberGeneratorComponent);
      this.componentRegistry.registerComponent(this.numberMultiplierComponent);
      this.componentRegistry.registerComponent(this.stateMachineComponent);
      this.componentRegistry.registerComponent(this.jobJtateMachineComponent);
    }
  }

  return AppModule;
}

export const components = [
  EventTriggerComponent,
  NumberGeneratorComponent,
  NumberMultiplierComponent,
  StateMachineComponent,
  JobStateMachineComponent,
]