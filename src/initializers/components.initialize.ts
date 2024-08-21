import { NumberGeneratorComponent } from '../components/number-generator/number-generator.handler';
import { NumberMultiplierComponent } from '../components/number-multiplier/number-multiplier.handler';
import { EventTriggerComponent } from '../components/event-trigger/event-trigger.handler';

export function initializeComponents(flow, component, amqpConnection, server) {
  let componentInstance;
  switch (component.componentRef) {
    case 'numberGenerator':
      componentInstance = new NumberGeneratorComponent(
        flow.id, 
        component.componentId, 
        amqpConnection, 
        server
      );
      break;
    case 'numberMultiplier':
      componentInstance = new NumberMultiplierComponent(
        flow.id, 
        component.componentId, 
        amqpConnection, 
        server
      );
      break;
    case 'eventTrigger':
      componentInstance = new EventTriggerComponent(
        flow.id, 
        component.componentId, 
        amqpConnection, 
        server
      );
      break;
    default:
      this.logger.warn(`Unknown component type: ${component.componentRef}`);
      break;
  }
  return componentInstance;
}