import { CustomLogger } from 'src/logger/custom-logger';
import { Injectable, Inject } from '@nestjs/common';
import { ComponentService } from '../base.component';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Server } from 'socket.io';

@Injectable()
export class EventTriggerComponent extends ComponentService {
  public logger;

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

  async handleEvent(_eventId: string, data: any): Promise<void> {
    this.logger.log(`EventTrigger handling event: ${_eventId}`);
    if (_eventId === 'triggerEvent') {
      const { flowId, componentId, eventId } = data;
      await this.publish(flowId, componentId, eventId, data);
    }
  }
}