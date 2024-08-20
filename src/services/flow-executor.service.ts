import { Injectable, Logger } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ComponentRegistry } from './component-registry.service';
import { Flow } from '../interfaces/flow.interface';

@Injectable()
export class FlowExecutorService {
  private readonly logger = new Logger(FlowExecutorService.name);

  constructor(
    private amqpConnection: AmqpConnection,
    private componentRegistry: ComponentRegistry
  ) {}

  async executeFlow(flow: Flow) {
    this.logger.log(`Executing flow: ${flow.id}`);

    // Create connections
    for (const connection of flow.connections) {
      this.logger.log(`Creating connection: ${connection.fromComponent}.${connection.fromEvent} -> ${connection.toComponent}.${connection.toEvent}`);
      await this.amqpConnection.publish('flow_exchange', 'createConnection', connection);
    }

    // Init components
    for (const component of flow.components) {
      const componentInstance = this.componentRegistry.getComponent(component.componentId);
      if (componentInstance) {
        this.logger.log(`Initializing component: ${component.componentId}`);
        try {
          await this.amqpConnection.publish('flow_exchange', 'componentEvent', {
            flowId: flow.id,
            componentId: component.componentId,
            eventName: 'init',
            data: {},
          });
        } catch (error) {
          this.logger.error(`Error initing component ${component.componentId}:`, error);
        }
      } else {
        this.logger.warn(`Component not found: ${component.componentId}`);
      }
    }
  }
}