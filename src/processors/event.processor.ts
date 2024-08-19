import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { ComponentRegistry } from '../services/component-registry.service';

@Injectable()
export class EventProcessor {
  private readonly logger = new Logger(EventProcessor.name);
  private connections: Map<string, { toComponent: string; toEvent: string }> = new Map();

  constructor(private componentRegistry: ComponentRegistry) {}

  @RabbitSubscribe({
    exchange: 'flow_exchange',
    routingKey: 'componentEvent',
    queue: 'component_event_queue',
  })
  async handle_component_event(msg: {componentId: string, eventName: string, data: any}) {
    const { componentId, eventName, data: eventData } = msg;
    this.logger.log(`Received componentEvent: ${componentId}.${eventName}, data: ${JSON.stringify(eventData)}`);
    
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

  @RabbitSubscribe({
    exchange: 'flow_exchange',
    routingKey: 'createConnection',
    queue: 'create_connection_queue',
  })
  async create_connection(msg: {fromComponent: string, fromEvent: string, toComponent: string, toEvent: string}) {
    const { fromComponent, fromEvent, toComponent, toEvent } = msg;
    this.logger.log(`Received createConnection: ${fromComponent}.${fromEvent} -> ${toComponent}.${toEvent}`);
    
    const connectionKey = `${fromComponent}.${fromEvent}`;
    this.connections.set(connectionKey, { toComponent, toEvent });
    this.logger.log(`Connection created: ${connectionKey} -> ${toComponent}.${toEvent}`);
    
    return { success: true, message: 'Connection created successfully' };
  }
}