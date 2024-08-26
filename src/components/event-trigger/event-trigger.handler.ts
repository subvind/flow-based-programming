import { CustomLogger } from '../../logger/custom-logger';
import { Injectable, Inject } from '@nestjs/common';
import { ComponentBase } from '../../bases/component.base';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Server } from 'socket.io';

import { triggerEvent } from './trigger-event.event';

@Injectable()
export class EventTriggerComponent extends ComponentBase {
  public logger;
  public ports = { // io format: <dataType>.<dataMethod>.<eventId>
    inputs: [
      'any.publish.triggerEvent',
    ],
    outputs: [
      'any.publish.any'
    ]
  }

  constructor(
    @Inject('FLOW_ID') flowId: string,
    @Inject('COMPONENT_ID') componentId: string,
    @Inject(AmqpConnection) amqpConnection: AmqpConnection,
    @Inject('WEB_SOCKET_SERVER') protected server: Server
  ) {
    super('eventTrigger', 'Event Trigger', 'Handles HTMX requests and triggers events', flowId, componentId, amqpConnection, server);
    this.flowId = flowId;
    this.componentId = componentId;
    this.logger = new CustomLogger(`${flowId}.${componentId}`, this.amqpConnection);
  }

  async handleEvent(eventId: string, data: any): Promise<void> {
    switch (eventId) {
      case 'triggerEvent':
        await this.triggerEvent(data);
        break;
      default:
        break;
    }
  }

  private async triggerEvent(data): Promise<void> {
    return await triggerEvent(this, data);
  }
}