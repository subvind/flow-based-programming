import { CustomLogger } from '../../logger/custom-logger';
import { Injectable, Inject } from '@nestjs/common';
import { ComponentBase } from '../../bases/component.base';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Server } from 'socket.io';
import { TemplateCacheService } from 'src/services/template-cache.service';

import { numberReceived } from './number-received.event';

@Injectable()
export class NumberMultiplierComponent extends ComponentBase {
  public logger;
  public ports = { // io format: <dataType>.<dataMethod>.<eventId>
    inputs: [
      'number.publish.firstNumberReceived',
      'number.publish.secondNumberReceived',
    ],
    outputs: [
      'number.publish.numberMultiplied',
      'htmx.display.number-multiplier',
    ]
  }

  public firstNumber: number | null = null;
  public secondNumber: number | null = null;

  constructor(
    @Inject('FLOW_ID') flowId: string,
    @Inject('COMPONENT_ID') componentId: string,
    @Inject(AmqpConnection) amqpConnection: AmqpConnection,
    @Inject('WEB_SOCKET_SERVER') protected server: Server,
    @Inject('TEMPLATES') templates: TemplateCacheService
  ) {
    super('numberMultiplier', 'number-multiplier', 'Multiplies two received numbers', flowId, componentId, amqpConnection, server, templates);
    this.flowId = flowId;
    this.componentId = componentId;
    this.logger = new CustomLogger(`${flowId}.${componentId}`, this.amqpConnection);
  }

  async handleEvent(eventId: string, data: any): Promise<void> {
    this.logger.log(`NumberMultiplier handling event: ${eventId} ${JSON.stringify(data, null, 2)}`);
    switch (eventId) {
      case 'firstNumberReceived':
        await this.numberReceived(data, 'first');
        break;
      case 'secondNumberReceived':
        await this.numberReceived(data, 'second');
        break;
      default:
        break;
    }
  }

  private numberReceived(data: any, which: 'first' | 'second'): Promise<void> {
    return numberReceived(this, data, which);
  }
}