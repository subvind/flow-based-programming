import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ComponentRegistry } from '../services/component-registry.service';
import { BackplaneService } from '../services/backplane.service';

@Injectable()
export class EventProcessor implements OnModuleInit {
  private readonly logger = new Logger(EventProcessor.name);
  private connections: Map<string, Array<{ toFlow: string; toComponent: string; toEvent: string }>> = new Map();

  constructor(
    private componentRegistry: ComponentRegistry,
    private backplaneService: BackplaneService
  ) {}

  async onModuleInit() {
    await this.subscribeToEvents();
  }

  private async subscribeToEvents() {
    try {
      await this.backplaneService.subscribe(
        'flow_exchange',
        'componentEvent',
        'component_event_queue',
        this.handleComponentEvent.bind(this)
      );

      await this.backplaneService.subscribe(
        'flow_exchange',
        'createConnection',
        'create_connection_queue',
        this.createConnection.bind(this)
      );
    } catch (error) {
      this.logger.error(`Failed to subscribe to events: ${error.message}`, error.stack);
    }
  }

  async handleComponentEvent(msg: {flowId: string, componentId: string, eventId: string, data: any}): Promise<void> {
    const { flowId, componentId, eventId, data: eventData } = msg;
    // this.logger.log(`[handleComponentEvent] [${flowId}.${componentId}.${eventId}] data: ${JSON.stringify(eventData)}`);
    
    const component = this.componentRegistry.getComponent(flowId, componentId);
    if (component) {
      // this.logger.log(`Passing event to component: ${componentId}`);
      await component.handleEvent(eventId, eventData);

      // Check if there are connections for this event
      const connectionKey = `${flowId}.${componentId}.${eventId}`;
      const connections = this.connections.get(connectionKey) || [];
      for (const connection of connections) {
        const { toFlow, toComponent, toEvent } = connection;
        // this.logger.log(`[forwardingComponentEvent] [${toFlow}.${toComponent}.${toEvent}]`);
        
        const targetComponent = this.componentRegistry.getComponent(toFlow, toComponent);
        if (targetComponent) {
          // this.logger.log(`Forwarding event to component: ${targetComponent.componentId}`);
          await targetComponent.handleEvent(toEvent, eventData);
        } else {
          this.logger.warn(`Target component not found: ${toComponent} in flow: ${toFlow}`);
        }
      }
    } else {
      this.logger.warn(`Component not found: ${flowId}.${componentId}`);
    }
  }

  async createConnection(msg: {flowId: string, fromComponent: string, fromEvent: string, toComponent: string, toEvent: string}): Promise<void>  {
    const { flowId, fromComponent, fromEvent, toComponent, toEvent } = msg;
    this.logger.log(`Received createConnection: ${flowId}.${fromComponent}.${fromEvent} -> ${toComponent}.${toEvent}`);
    
    const connectionKey = `${flowId}.${fromComponent}.${fromEvent}`;
    if (!this.connections.has(connectionKey)) {
      this.connections.set(connectionKey, []);
    }
    this.connections.get(connectionKey).push({ toFlow: flowId, toComponent, toEvent });
    this.logger.log(`Connection created: ${connectionKey} -> ${toComponent}.${toEvent}`);
  }
}