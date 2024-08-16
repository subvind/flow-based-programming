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