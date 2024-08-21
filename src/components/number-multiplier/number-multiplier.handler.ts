import { CustomLogger } from 'src/logger/custom-logger';
import { Injectable, Inject } from '@nestjs/common';
import { ComponentService } from '../../base.component';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Server } from 'socket.io';

import { numberReceived } from './number-received.event';

@Injectable()
export class NumberMultiplierComponent extends ComponentService {
  public logger;

  constructor(
    @Inject('FLOW_ID') flowId: string,
    @Inject('COMPONENT_ID') componentId: string,
    @Inject(AmqpConnection) amqpConnection: AmqpConnection,
    @Inject('WEB_SOCKET_SERVER') protected server: Server
  ) {
    super('numberMultiplier', 'Number Multiplier', 'Multiplies received number by 2', flowId, componentId, amqpConnection, server);
    this.flowId = flowId;
    this.componentId = componentId;
    this.logger = new CustomLogger(`${flowId}.${componentId}`, this.amqpConnection);
  }

  async handleEvent(eventId: string, data: any): Promise<void> {
    this.logger.log(`NumberMultiplier handling event: ${eventId} ${JSON.stringify(data, null, 2)}`);
    switch (eventId) {
      case 'numberReceived':
        await this.numberReceived(data);
        break;
      default:
        break;
    }
  }

  private numberReceived(data): Promise<void> {
    return numberReceived(this, data);
  }
}