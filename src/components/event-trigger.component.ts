import { Injectable, Inject } from '@nestjs/common';
import { ComponentService } from '../base.component';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class EventTriggerComponent extends ComponentService {
  constructor(
    @Inject('FLOW_ID') flowId: string,
    @Inject('COMPONENT_ID') componentId: string,
    @Inject(AmqpConnection) amqpConnection: AmqpConnection
  ) {
    super('eventTrigger', 'Event Trigger', 'Handles HTMX requests and triggers events', flowId, componentId, amqpConnection);
  }

  async handleEvent(eventName: string, data: any): Promise<void> {
    this.logger.log(`EventTrigger handling event: ${eventName}`);
    if (eventName === 'triggerEvent') {
      const { flowId, componentId, eventId } = data;
      await this.publish({
        flowId,
        componentId,
        eventName: eventId,
        data: data.data,
      });
    }
  }
}