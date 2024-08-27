import { Inject, Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Component } from '../interfaces/component.interface';
import { CustomLogger } from '../logger/custom-logger';
import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server } from 'socket.io';
import * as ejs from 'ejs';
import * as path from 'path';
import { Connection } from 'src/interfaces/connection.interface';
import { Port } from 'src/interfaces/port.interface';
import { ComponentRegistry } from 'src/services/component-registry.service';

@WebSocketGateway()
@Injectable()
export abstract class ComponentBase implements Component {
  protected readonly logger: CustomLogger;
  public _ports: { inputs: Port[]; outputs: Port[]; };
  public ports: { inputs: string[]; outputs: string[]; };
  public _connections: Map<string, Component> = new Map();
  public connections: Connection[];

  constructor(
    public componentId: string,
    public slug: string,
    public description: string,
    public flowId: string,
    public componentRef: string,
    @Inject(AmqpConnection) protected amqpConnection: AmqpConnection,
    protected server: Server,
  ) {
    this.logger = new CustomLogger(this.componentId, amqpConnection);
  }

  abstract handleEvent(eventId: string, data: any): Promise<void>;

  async publish(flowId: string, componentId: string, eventId: string, data: any): Promise<void> {
    this.logger.log(`Publishing: ${flowId}.${componentId}.${eventId} -> ${data}`);
    if (!this.amqpConnection) {
      this.logger.error('AmqpConnection is not initialized');
      return;
    }
    await this.amqpConnection.publish('flow_exchange', 'componentEvent', {
      flowId,
      componentId,
      eventId,
      data,
    });
  }

  @SubscribeMessage('client-event')
  handleClientEvent(@MessageBody() data: any): void {
    const { flowId, componentId, eventId, ...eventData } = data;
    this.logger.log(`Received client event: flowId=${flowId}, componentId=${componentId}, eventId=${eventId}, data=${JSON.stringify(eventData)}`);
    this.publish(flowId, componentId, 'clientEventReceived', eventData);
  }

  protected async display(flowId: string, componentId: string, templateId: string, data: any) {
    data._flowId = flowId;
    data._componentId = componentId;
    data._templateId = templateId;
    const htmxContent = await this.generateHtmxContent(data);
    
    if (this.server) {
      this.logger.log(htmxContent)
      this.server.emit('display-flow-component-template-content', {
        flowId,
        componentId,
        templateId,
        content: htmxContent
      });
    } else {
      this.logger.warn('WebSocket server is not initialized');
    }
  }

  private async generateHtmxContent(data: any): Promise<string> {
    const templatePath = path.resolve(__dirname, `../templates/${data._templateId}.ejs`);
    try {
      return await ejs.renderFile(templatePath, data);
    } catch (error) {
      this.logger.error(`Error rendering EJS template: ${error.message}`);
      return `<div>Error rendering content</div>`;
    }
  }

  public async syncConnections(connections: Connection[], componentRegistry: ComponentRegistry): Promise<void> {
    if (connections) {
      this.connections = [];
      connections.forEach(async (connection, index) => {
        // console.log('connection', connection);
        // console.log('this.componentRegistry', componentRegistry)
        if (connection.fromFlow === this.flowId && connection.fromComponent === this.componentId) {
          console.log('from is the current instance so register to instance');
          const connectionKey = `${connection.fromEvent}>${connection.toFlow}.${connection.toComponent}.${connection.toEvent}`;
          const connectedComponentInstance = componentRegistry.getComponent(connection.toFlow, connection.toComponent);
          this._connections.set(connectionKey, connectedComponentInstance);
          connection.connectedTo = connectedComponentInstance;
          connection.connectedFrom = this;
          this.connections.push(connection);
        } else if (connection.toFlow === this.flowId && connection.toComponent === this.componentId) {
          console.log('to is the current instance so register from instance');
          const connectionKey = `${connection.toEvent}>${connection.fromFlow}.${connection.fromComponent}.${connection.fromEvent}`;
          const connectedComponentInstance = componentRegistry.getComponent(connection.fromFlow, connection.fromComponent);
          this._connections.set(connectionKey, connectedComponentInstance);
          connection.connectedTo = this;
          connection.connectedFrom = connectedComponentInstance;
          this.connections.push(connection);
        } else {
          // connection does not match; do nothing.
        }
      })
    }
  }

  // TODO: addPort()

  // TODO: removePort()

  // TODO: connectComponentToPort()

  // TODO: disconnectComponentFromPort()

  public async getPorts(): Promise<{ inputs: Port[], outputs: Port[] }> {
    // portId format: <dataType>.<dataMethod>.<eventId>
    let ports = {
      inputs: [],
      outputs: []
    }
    this.ports.inputs.forEach(async (input) => {
      let i = input.split('.');
      let port: Port = {
        direction: 'input',
        dataType: i[0],
        dataMethod: i[1] === 'display' ? 'display' : 'publish',
        eventId: i[2],
        connections: [...await this.loadConnections('input', i[2])]
      }
      ports.inputs.push(port);
    });
    this.ports.outputs.forEach(async (output) => {
      let o = output.split('.');
      let port: Port = {
        direction: 'output',
        dataType: o[0],
        dataMethod: o[1] === 'display' ? 'display' : 'publish',
        eventId: o[2],
        connections: [...await this.loadConnections('output', o[2])]
      }
      ports.outputs.push(port);
    });
    this._ports = ports;
    return ports;
  }

  private async loadConnections(direction: string, eventId: string): Promise<Connection[]> {
    let connections: Connection[] = [];
    // console.log('this.connections', this.connections);
    if (this.connections) {
      this.connections.forEach((connection: Connection) => {
        // console.log('connection', connection);
        if (direction === 'input') {
          if (connection.toEvent === eventId) {
            connections.push(connection);
          }
        } else {
          if (connection.fromEvent === eventId) {
            connections.push(connection);
          }
        }
      });
      return connections;
    } else {
      return [];
    }
  }

  public async findPort(portId: string): Promise<Port> {
    // portId format: <dataType>.<dataMethod>.<eventId>
    const pId = portId.split('.');
    const eventId = pId[2];
    const ports = await this.getPorts();
    let port: Port;
    ports.inputs.forEach((input: Port) => {
      if (input.eventId === eventId) {
        port = input;
      }
    });
    ports.outputs.forEach((output: Port) => {
      if (output.eventId === eventId) {
        port = output;
      }
    });
    return port;
  }

  public async findConnections(port: Port): Promise<Connection[]> {
    if (port && port.connections) {
      return port.connections;
    }
    return [];
  }
}