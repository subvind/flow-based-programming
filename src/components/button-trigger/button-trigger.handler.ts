import { CustomLogger } from '../../logger/custom-logger';
import { Injectable, Inject } from '@nestjs/common';
import { ComponentBase } from '../../bases/component.base';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Server } from 'socket.io';

import { triggerButton } from './trigger-button.event';

@Injectable()
export class ButtonTriggerComponent extends ComponentBase {
  public logger: CustomLogger;
  public ports = {
    inputs: [
      'any.publish.triggerButton',
    ],
    outputs: [
      'any.publish.buttonPressed',
      'htmx.display.button-trigger'
    ]
  }

  constructor(
    @Inject('FLOW_ID') flowId: string,
    @Inject('COMPONENT_ID') componentId: string,
    @Inject(AmqpConnection) amqpConnection: AmqpConnection,
    @Inject('WEB_SOCKET_SERVER') protected server: Server
  ) {
    super('buttonTrigger', 'button-trigger', 'Handles button presses and triggers events', flowId, componentId, amqpConnection, server);
    this.flowId = flowId;
    this.componentId = componentId;
    this.logger = new CustomLogger(`${flowId}.${componentId}`, this.amqpConnection);
  }

  async handleEvent(eventId: string, data: any): Promise<void> {
    this.logger.log(`Handling event: ${eventId}`);
    switch (eventId) {
      case "triggerButton": {
        await this.triggerButton(data);
        break;
      }
      default: {
        break;
      }
    }
  }

  private async triggerButton(data: any): Promise<void> {
    return triggerButton(this, data);
  }
}