import { CustomLogger } from '../../logger/custom-logger';
import { Injectable, Inject } from '@nestjs/common';
import { ComponentBase } from '../../bases/component.base';
import { BackplaneService } from 'src/services/backplane.service';
import { Server } from 'socket.io';
import { TemplateCacheService } from 'src/services/template-cache.service';

import { triggerButton } from './trigger-button.event';
import { init } from './init.event';

@Injectable()
export class ButtonTriggerComponent extends ComponentBase {
  public template: string = 'button-trigger';
  public logger: CustomLogger;
  public ports = {
    inputs: [
      'any.publish.triggerButton',
      'any.publish.init',
    ],
    outputs: [
      'any.publish.buttonPressed',
      'htmx.display.button-trigger'
    ]
  }

  constructor(
    @Inject('FLOW_ID') flowId: string,
    @Inject('COMPONENT_ID') componentId: string,
    @Inject(BackplaneService) backplane: BackplaneService,
    @Inject('WEB_SOCKET_SERVER') protected server: Server,
    @Inject('TEMPLATES') templates: TemplateCacheService
  ) {
    super('buttonTrigger', 'button-trigger', 'Handles button presses and triggers events', flowId, componentId, backplane, server, templates);
    this.flowId = flowId;
    this.componentId = componentId;
    this.logger = new CustomLogger(`${flowId}.${componentId}`);
  }

  async handleEvent(eventId: string, data: any): Promise<void> {
    this.logger.log(`Handling event: ${eventId}`);
    switch (eventId) {
      case "init": {
        await this.init(data);
        break;
      }
      case "triggerButton": {
        await this.triggerButton(data);
        break;
      }
      default: {
        break;
      }
    }
  }

  private async init(data: any): Promise<void> {
    return init(this, data);
  }

  private async triggerButton(data: any): Promise<void> {
    return triggerButton(this, data);
  }
}