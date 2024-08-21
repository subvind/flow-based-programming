import { Inject, Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Component } from './interfaces/component.interface';
import { CustomLogger } from './logger/custom-logger';
import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server } from 'socket.io';
import * as ejs from 'ejs';
import * as path from 'path';

@WebSocketGateway()
@Injectable()
export abstract class ComponentService implements Component {
  protected readonly logger: CustomLogger;
  
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
    this.logger.log(`Emitting event: ${eventId}, flowId: ${this.flowId}, data: ${JSON.stringify(data)}`);
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

  protected async sendHtmxUpdate(templateId: string, data: any) {
    const htmxContent = await this.generateHtmxContent(data, templateId);
    
    if (this.server) {
      this.server.emit('htmx-update', {
        flowId: this.flowId,
        componentId: this.componentId,
        templateId,
        content: htmxContent
      });
    } else {
      this.logger.warn('WebSocket server is not initialized');
    }
  }

  private async generateHtmxContent(data: any, templateId: string): Promise<string> {
    const templatePath = path.resolve(__dirname, `./templates/${templateId}.ejs`);
    try {
      return await ejs.renderFile(templatePath, { 
        flowId: this.flowId, 
        componentId: this.componentId, 
        templateId, 
        data
      });
    } catch (error) {
      this.logger.error(`Error rendering EJS template: ${error.message}`);
      return `<div>Error rendering content</div>`;
    }
  }
}