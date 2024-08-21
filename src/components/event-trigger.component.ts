import { Injectable, Inject } from '@nestjs/common';
import { ComponentService } from '../base.component';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Server } from 'socket.io';

@Injectable()
export class EventTriggerComponent extends ComponentService {
  constructor(
    @Inject('FLOW_ID') flowId: string,
    @Inject('COMPONENT_ID') componentId: string,
    @Inject(AmqpConnection) amqpConnection: AmqpConnection,
    @Inject('WEB_SOCKET_SERVER') protected webSocketServer: Server
  ) {
    super('eventTrigger', 'Event Trigger', 'Handles HTMX requests and triggers events', flowId, componentId, amqpConnection, webSocketServer);
  }

  async handleEvent(_eventId: string, data: any): Promise<void> {
    this.logger.log(`EventTrigger handling event: ${_eventId}`);
    if (_eventId === 'triggerEvent') {
      const { flowId, componentId, eventId } = data;
      await this.publish(flowId, componentId, eventId, data);
    }
  }
}