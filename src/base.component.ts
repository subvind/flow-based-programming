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
  @Inject(AmqpConnection)
  protected amqpConnection: AmqpConnection;
  protected readonly logger: CustomLogger;

  @WebSocketServer() server: Server;

  constructor(
    public id: string,
    public name: string,
    public description: string
  ) {
    this.logger = new CustomLogger(this.id, this.amqpConnection);
  }

  abstract handleEvent(eventName: string, data: any): Promise<void>;

  async emitEvent(eventName: string, data: any): Promise<void> {
    this.logger.log(`Emitting event: ${eventName}, data: ${JSON.stringify(data)}`);
    await this.amqpConnection.publish('flow_exchange', 'componentEvent', {
      componentId: this.id,
      eventName,
      data,
    });
  }

  @SubscribeMessage('client-event')
  handleClientEvent(@MessageBody() data: any): void {
    const { flowId, componentId, eventId, ...eventData } = data;
    this.logger.log(`Received client event: flowId=${flowId}, componentId=${componentId}, eventId=${eventId}, data=${JSON.stringify(eventData)}`);
    this.emitEvent('clientEventReceived', { flowId, componentId, eventId, data: eventData });
  }

  protected async sendHtmxUpdate(data: any, templateId: string) {
    const { flowId } = data;
    const htmxContent = await this.generate_htmx_content(data, flowId, templateId);
    
    this.server.emit('htmx-update', {
      flowId,
      componentId: this.id,
      templateId,
      content: htmxContent
    });
  }

  private async generate_htmx_content(data: any, flowId: string, templateId: string): Promise<string> {
    const template_path = path.resolve(__dirname, `./templates/${templateId}.ejs`);
    try {
      return await ejs.renderFile(template_path, { 
        data, 
        flowId, 
        componentId: this.id, 
        templateId 
      });
    } catch (error) {
      this.logger.error(`Error rendering EJS template: ${error.message}`);
      return `<div>Error rendering content</div>`;
    }
  }

  async publish(message: any): Promise<void> {
    try {
      await this.amqpConnection.publish('flow_exchange', 'componentEvent', message);
    } catch (error) {
      this.logger.error(`Error publishing message: ${error.message}`);
      throw error;
    }
  }
}