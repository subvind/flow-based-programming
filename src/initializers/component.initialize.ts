import { EventTriggerComponent } from '../components/event-trigger/event-trigger.handler';
import { NumberGeneratorComponent } from '../components/number-generator/number-generator.handler';
import { NumberMultiplierComponent } from '../components/number-multiplier/number-multiplier.handler';
import { StateMachineComponent } from 'src/components/state-machine/state-machine.handler';
import { JobStateMachineComponent } from 'src/components/job-state-machine/job-state-machine.handler';
import { ButtonTriggerComponent } from 'src/components/button-trigger/button-trigger.handler';

export function initializeComponent(flow, component, amqpConnection, server) {
  let componentInstance;
  switch (component.componentRef) {
    case 'eventTrigger':
      componentInstance = new EventTriggerComponent(flow.id, component.componentId, amqpConnection, server);
      break;
    case 'numberGenerator':
      componentInstance = new NumberGeneratorComponent(flow.id, component.componentId, amqpConnection, server);
      break;
    case 'numberMultiplier':
      componentInstance = new NumberMultiplierComponent(flow.id, component.componentId, amqpConnection, server);
      break;
    case 'stateMachine':
      componentInstance = new StateMachineComponent(flow.id, component.componentId, amqpConnection, server);
      break;
    case 'jobStateMachine':
      componentInstance = new JobStateMachineComponent(flow.id, component.componentId, amqpConnection, server);
      break;
    case 'buttonTrigger':
      componentInstance = new ButtonTriggerComponent(flow.id, component.componentId, amqpConnection, server);
      break;
    default:
      this.logger.warn(`Unknown component type: ${component.componentRef}`);
      break;
  }
  return componentInstance;
}