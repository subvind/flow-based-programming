import { CustomLogger } from '../../logger/custom-logger';
import { Injectable, Inject } from '@nestjs/common';
import { ComponentBase } from '../../bases/component.base';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Server } from 'socket.io';
import { TemplateCacheService } from 'src/services/template-cache.service';

import { startGenerating } from './start-generating.event';
import { stopGenerating } from './stop-generating.event';

@Injectable()
export class NumberGeneratorComponent extends ComponentBase {
  public logger;
  public interval: NodeJS.Timeout | null = null;
  public ports = { // io format: <dataType>.<dataMethod>.<eventId>
    inputs: [
      'any.publish.start',
      'any.publish.stop'
    ],
    outputs: [
      'number.publish.numberGenerated',
      'htmx.display.number-generator'
    ]
  }

  constructor(
    @Inject('FLOW_ID') flowId: string,
    @Inject('COMPONENT_ID') componentId: string,
    @Inject(AmqpConnection) amqpConnection: AmqpConnection,
    @Inject('WEB_SOCKET_SERVER') protected server: Server,
    @Inject('TEMPLATES') templates: TemplateCacheService
  ) {
    super('numberGenerator', 'number-generator', 'Generates random numbers periodically', flowId, componentId, amqpConnection, server, templates);
    this.flowId = flowId;
    this.componentId = componentId;
    this.logger = new CustomLogger(`${flowId}.${componentId}`, this.amqpConnection);
  }

  async handleEvent(eventId: string, data: any): Promise<void> {
    this.logger.log(`NumberGenerator (${this.flowId}) handling event: ${eventId}`);
    switch (eventId) {
      case "start": {
        this.logger.log(`NumberGenerator (${this.flowId}) starting number generation`);
        this.startGenerating(data);
        break;
      }
      case "stop": {
        this.logger.log(`NumberGenerator (${this.flowId}) stopping number generation`);
        this.stopGenerating(data);
        break;
      }
    }
  }

  private startGenerating(data): void {
    return startGenerating(this, data);
  }

  private stopGenerating(data): void {
    return stopGenerating(this, data);
  }
}