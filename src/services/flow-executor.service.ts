import { Injectable, Logger } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ComponentRegistry } from './component-registry.service';
import { Flow } from '../interfaces/flow.interface';
import { NumberGeneratorComponent } from '../components/number-generator.component';
import { NumberMultiplierComponent } from '../components/number-multiplier.component';
import { EventTriggerComponent } from '../components/event-trigger.component';

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
      await this.amqpConnection.publish('flow_exchange', 'createConnection', { ...connection, flowId: flow.id });
    }

    // Init components
    for (const component of flow.components) {
      let componentInstance;
      switch (component.componentId) {
        case 'numberGenerator':
          componentInstance = new NumberGeneratorComponent(flow.id, component.id, this.amqpConnection);
          break;
        case 'numberMultiplier':
          componentInstance = new NumberMultiplierComponent(flow.id, component.id, this.amqpConnection);
          break;
        case 'eventTrigger':
          componentInstance = new EventTriggerComponent(flow.id, component.id, this.amqpConnection);
          break;
        default:
          this.logger.warn(`Unknown component type: ${component.componentId}`);
          continue;
      }
      
      this.componentRegistry.registerComponent(componentInstance);
      this.componentRegistry.registerComponentId(component.id, componentInstance);
      
      this.logger.log(`Initializing component: ${component.componentId} for flow: ${flow.id}`);
      try {
        await this.amqpConnection.publish('flow_exchange', 'componentEvent', {
          flowId: flow.id,
          componentId: component.id,
          eventName: 'init',
          data: {},
        });
      } catch (error) {
        this.logger.error(`Error initing component ${component.componentId} for flow ${flow.id}:`, error);
      }
    }
  }
}