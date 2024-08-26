import { Inject, Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Component } from '../interfaces/component.interface';
import { CustomLogger } from '../logger/custom-logger';
import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server } from 'socket.io';
import * as ejs from 'ejs';
import * as path from 'path';

@WebSocketGateway()
@Injectable()
export abstract class ComponentBase implements Component {
  protected readonly logger: CustomLogger;
  public ports;
  
  constructor(
    public componentId: string,
    public name: string,
    public description: string,
    public flowId: string,
    public componentRef: string,
    @Inject(AmqpConnection) protected amqpConnection: AmqpConnection,
    protected server: Server
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
}