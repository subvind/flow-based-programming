import { CustomLogger } from 'src/logger/custom-logger';
import { Injectable, Inject } from '@nestjs/common';
import { ComponentService } from '../base.component';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Server } from 'socket.io';

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
    if (eventId === 'numberReceived') {
      const inputNumber = typeof data === 'number' ? data : parseFloat(data);
      if (isNaN(inputNumber)) {
        this.logger.warn(`Received invalid number: ${JSON.stringify(data, null, 2)}`);
        return;
      }
      const result = inputNumber * 2;
      this.logger.log(`NumberMultiplier received ${inputNumber}, multiplied result: ${result}`);
      await this.publish(this.flowId, this.componentId, 'numberMultiplied', result);

      // Send HTMX update
      await this.sendHtmxUpdate('number-multiplier', {
        input: inputNumber,
        result: result,
        timestamp: Date.now()
      });
    }
  }
}