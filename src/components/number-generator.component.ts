import { Injectable, Inject } from '@nestjs/common';
import { ComponentService } from '../base.component';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Server } from 'socket.io';

@Injectable()
export class NumberGeneratorComponent extends ComponentService {
  private interval: NodeJS.Timeout | null = null;

  constructor(
    @Inject('FLOW_ID') flowId: string,
    @Inject('COMPONENT_ID') componentId: string,
    @Inject(AmqpConnection) amqpConnection: AmqpConnection,
    @Inject('WEB_SOCKET_SERVER') webSocketServer: Server
  ) {
    super('numberGenerator', 'Number Generator', 'Generates random numbers periodically', flowId, componentId, amqpConnection, webSocketServer);
  }

  async handleEvent(eventId: string, data: any): Promise<void> {
    this.logger.log(`NumberGenerator (${this.flowId}) handling event: ${eventId}`);
    switch (eventId) {
      case "start": {
        this.logger.log(`NumberGenerator (${this.flowId}) starting number generation`);
        this.startGenerating();
        break;
      }
      case "stop": {
        this.logger.log(`NumberGenerator (${this.flowId}) stopping number generation`);
        this.stopGenerating();
        break;
      }
    }
  }

  private startGenerating(): void {
    this.logger.log(`NumberGenerator (${this.flowId}) startGenerating method called`);
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.interval = setInterval(async () => {
      var randomNumber = Math.random();
      this.logger.log(`NumberGenerator (${this.flowId}) generated number: ${randomNumber}`);
      await this.publish(this.flowId, this.componentId, 'numberGenerated', randomNumber);
      
      // Send HTMX update
      await this.sendHtmxUpdate('number-generator', {
        number: randomNumber,
        timestamp: Date.now(),
        flowId: this.flowId
      });
    }, 1000);
  }

  private stopGenerating(): void {
    this.logger.log(`NumberGenerator (${this.flowId}) stopGenerating method called`);
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}