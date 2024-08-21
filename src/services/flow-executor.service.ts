import { Injectable, Logger } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ComponentRegistry } from './component-registry.service';
import { Flow } from '../interfaces/flow.interface';
import { NumberGeneratorComponent } from '../components/number-generator.component';
import { NumberMultiplierComponent } from '../components/number-multiplier.component';
import { EventTriggerComponent } from '../components/event-trigger.component';
import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway()
@Injectable()
export class FlowExecutorService {
  @WebSocketServer() server: Server;
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
      console.log('component.componentId', component.componentId)
      let componentInstance;
      switch (component.componentRef) {
        case 'numberGenerator':
          componentInstance = new NumberGeneratorComponent(flow.id, component.componentId, this.amqpConnection, this.server);
          break;
        case 'numberMultiplier':
          componentInstance = new NumberMultiplierComponent(flow.id, component.componentId, this.amqpConnection, this.server);
          break;
        case 'eventTrigger':
          componentInstance = new EventTriggerComponent(flow.id, component.componentId, this.amqpConnection, this.server);
          break;
        default:
          this.logger.warn(`Unknown component type: ${component.componentId}`);
          continue;
      }

      console.log('component.componentId', componentInstance.componentId)
      // this.componentRegistry.registerComponentName(componentInstance);
      this.componentRegistry.registerComponentId(componentInstance);
      
      this.logger.log(`Initializing component: ${component.componentId} for flow: ${flow.id}`);
      try {
        await this.amqpConnection.publish('flow_exchange', 'componentEvent', {
          flowId: flow.id,
          componentId: component.componentId,
          eventId: 'init',
          data: {},
        });
      } catch (error) {
        this.logger.error(`Error initing component ${component.componentId} for flow ${flow.id}:`, error);
      }
    }
  }
}