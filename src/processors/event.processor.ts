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