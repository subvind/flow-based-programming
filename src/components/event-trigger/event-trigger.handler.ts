import { CustomLogger } from '../../logger/custom-logger';
import { Injectable, Inject } from '@nestjs/common';
import { ComponentBase } from '../../bases/component.base';
import { BackplaneService } from 'src/services/backplane.service';
import { Server } from 'socket.io';
import { TemplateCacheService } from 'src/services/template-cache.service';

import { triggerEvent } from './trigger-event.event';

@Injectable()
export class EventTriggerComponent extends ComponentBase {
  public logger: CustomLogger;
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
    @Inject(BackplaneService) protected backplane: BackplaneService,
    @Inject('WEB_SOCKET_SERVER') protected server: Server,
    @Inject('TEMPLATES') templates: TemplateCacheService
  ) {
    super('eventTrigger', 'event-trigger', 'Handles HTMX requests and triggers events', flowId, componentId, backplane, server, templates);
    this.flowId = flowId;
    this.componentId = componentId;
    this.logger = new CustomLogger(`${flowId}.${componentId}`);
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

  private async triggerEvent(data: any): Promise<void> {
    return await triggerEvent(this, data);
  }
}