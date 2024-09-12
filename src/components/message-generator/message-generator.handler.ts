import { CustomLogger } from '../../logger/custom-logger';
import { Injectable, Inject } from '@nestjs/common';
import { ComponentBase } from '../../bases/component.base';
import { BackplaneService } from 'src/services/backplane.service';
import { Server } from 'socket.io';
import { TemplateCacheService } from 'src/services/template-cache.service';

@Injectable()
export class MessageGeneratorComponent extends ComponentBase {
  public logger;
  public interval: NodeJS.Timeout | null = null;
  public messageSize: number = 1;
  public ports = {
    inputs: [
      'any.publish.start',
      'any.publish.stop',
      'any.publish.setMessageSize'
    ],
    outputs: [
      'any.publish.messageGenerated'
    ]
  }

  constructor(
    @Inject('FLOW_ID') flowId: string,
    @Inject('COMPONENT_ID') componentId: string,
    @Inject(BackplaneService) backplane: BackplaneService,
    @Inject('WEB_SOCKET_SERVER') protected server: Server,
    @Inject('TEMPLATES') templates: TemplateCacheService
  ) {
    super('messageGenerator', 'message-generator', 'Generates messages for benchmarking', flowId, componentId, backplane, server, templates);
    this.flowId = flowId;
    this.componentId = componentId;
    this.logger = new CustomLogger(`${flowId}.${componentId}`);
  }

  async handleEvent(eventId: string, data: any): Promise<void> {
    this.logger.log(`MessageGenerator (${this.flowId}) handling event: ${eventId}`);
    switch (eventId) {
      case "start": {
        this.startGenerating();
        break;
      }
      case "stop": {
        this.stopGenerating();
        break;
      }
      case "setMessageSize": {
        this.setMessageSize(data.size);
        break;
      }
    }
  }

  private startGenerating(): void {
    this.logger.log(`MessageGenerator (${this.flowId}) starting message generation`);
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.interval = setInterval(async () => {
      const message = { 
        timestamp: Date.now(), 
        content: "B".repeat(this.messageSize),
        size: this.messageSize
      };
      await this.publish(this.flowId, this.componentId, 'messageGenerated', message);
    }, 10); // Generate a message every 10ms
  }

  private stopGenerating(): void {
    this.logger.log(`MessageGenerator (${this.flowId}) stopping message generation`);
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private setMessageSize(size: number): void {
    this.logger.log(`MessageGenerator (${this.flowId}) setting message size to ${size} bytes`);
    this.messageSize = size;
  }
}