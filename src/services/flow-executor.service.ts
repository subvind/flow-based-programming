import { Injectable, Logger } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ComponentRegistry } from './component-registry.service';
import { Flow } from '../interfaces/flow.interface';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { initializeComponents } from 'src/initializers/components.initialize';

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
      this.logger.log(`Initializing component: ${component.componentId} (${component.componentRef}) for flow: ${flow.id}`);
      
      // initialize a new component instance
      let componentInstance = initializeComponents(flow, component, this.amqpConnection, this.server);

      // register new instance with component registery 
      this.componentRegistry.registerComponent(componentInstance);
 
      // publish init eventId command 
      try {
        await this.amqpConnection.publish('flow_exchange', 'componentEvent', {
          flowId: flow.id,
          componentId: component.componentId,
          componentRef: component.componentRef,
          eventId: 'init',
          data: {},
        });
      } catch (error) {
        this.logger.error(`Error initializing component ${component.componentId} for flow ${flow.id}:`, error);
      }
    }
  }
}