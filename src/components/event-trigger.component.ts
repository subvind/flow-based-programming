import { Injectable } from '@nestjs/common';
import { ComponentService } from '../base.component';

@Injectable()
export class EventTriggerComponent extends ComponentService {

  constructor() {
    super('eventTrigger', 'Event Trigger', 'Sends and receives HTMX over WebSocket');
  }

  async handleEvent(eventName: string, data: any): Promise<void> {
    this.logger.log(`EventTrigger handling event: ${eventName}`);
    if (eventName === 'triggerEvent') {
      await this.sendHtmxUpdate(data, 'event-trigger');
    }
  }
}