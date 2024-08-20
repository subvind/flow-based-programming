import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { ComponentRegistry } from '../services/component-registry.service';

@Injectable()
export class EventProcessor {
  private readonly logger = new Logger(EventProcessor.name);
  private connections: Map<string, { toFlow: string; toComponent: string; toEvent: string }> = new Map();

  constructor(private componentRegistry: ComponentRegistry) {}

  @RabbitSubscribe({
    exchange: 'flow_exchange',
    routingKey: 'componentEvent',
    queue: 'component_event_queue',
  })
  async handleComponentEvent(msg: {flowId: string, componentId: string, eventName: string, data: any}) {
    const { flowId, componentId, eventName, data: eventData } = msg;
    this.logger.log(`[handleComponentEvent] [${flowId}.${componentId}.${eventName}] data: ${JSON.stringify(eventData)}`);
    
    const component = this.componentRegistry.getComponentId(componentId);
    if (component) {
      this.logger.log(`Passing event to component: ${componentId}`);
      await component.handleEvent(eventName, eventData);

      // Check if there's a connection for this event
      const connectionKey = `${flowId}.${componentId}.${eventName}`;
      const connection = this.connections.get(connectionKey);
      if (connection) {
        const { toFlow, toComponent, toEvent } = connection;
        this.logger.log(`[forwardingComponentEvent] [${toFlow}.${toComponent}.${toEvent}]`);
        
        // Convert flow-defined toComponent to registry-defined componentId
        const targetComponent = this.componentRegistry.getComponentId(toComponent);
        if (targetComponent) {
          this.logger.log(`Forwarding event to component: ${targetComponent.id}`);
          await targetComponent.handleEvent(toEvent, { ...eventData, flowId: toFlow });
        } else {
          this.logger.warn(`Target component not found: ${toComponent} in flow: ${toFlow}`);
        }
      }
    } else {
      this.logger.warn(`Component key not found: ${componentId}`);
    }
  }

  @RabbitSubscribe({
    exchange: 'flow_exchange',
    routingKey: 'createConnection',
    queue: 'create_connection_queue',
  })
  async createConnection(msg: {flowId: string, fromComponent: string, fromEvent: string, toComponent: string, toEvent: string}) {
    const { flowId, fromComponent, fromEvent, toComponent, toEvent } = msg;
    this.logger.log(`Received createConnection: ${flowId}.${fromComponent}.${fromEvent} -> ${toComponent}.${toEvent}`);
    
    const connectionKey = `${flowId}.${fromComponent}.${fromEvent}`;
    this.connections.set(connectionKey, { toFlow: flowId, toComponent, toEvent });
    this.logger.log(`Connection created: ${connectionKey} -> ${toComponent}.${toEvent}`);
    
    return { success: true, message: 'Connection created successfully' };
  }
}