import { CustomLogger } from '../../logger/custom-logger';
import { Injectable, Inject } from '@nestjs/common';
import { ComponentBase } from '../../bases/component.base';
import { BackplaneService } from 'src/services/backplane.service';
import { Server } from 'socket.io';
import { TemplateCacheService } from 'src/services/template-cache.service';

@Injectable()
export class MessageGeneratorComponent extends ComponentBase {
  public logger: CustomLogger;
  private messageSize: number = 1;
  private messagesToGenerate: number = 500;
  private isGenerating: boolean = false;
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
    // this.logger.log(`MessageGenerator (${this.flowId}) handling event: ${eventId}`);
    switch (eventId) {
      case "init": {
        await this.initGenerator(data);
        break;
      }
      case "start": {
        await this.startGenerating();
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

  private async initGenerator(data: any): Promise<void> {
    if (data && data.messagesPerSize) {
      this.messagesToGenerate = data.messagesPerSize;
    }
    this.logger.log(`MessageGenerator initialized with messages to generate: ${this.messagesToGenerate}`);
  }

  private async startGenerating(): Promise<void> {
    this.logger.log(`MessageGenerator (${this.flowId}) starting message generation`);
    this.isGenerating = true;
    
    for (let i = 0; i < this.messagesToGenerate + 10 && this.isGenerating; i++) {
      const message = { 
        timestamp: Date.now(), 
        content: "B".repeat(this.messageSize),
        size: this.messageSize
      };
      await this.publish(this.flowId, this.componentId, 'messageGenerated', message);
      
      // Optional: Add a small delay to prevent blocking the event loop
      if (i % 1000 === 0) {
        await new Promise(resolve => setImmediate(resolve));
      }
    }

    this.isGenerating = false;
    this.logger.log(`MessageGenerator (${this.flowId}) finished generating ${this.messagesToGenerate} messages`);
  }

  private stopGenerating(): void {
    this.logger.log(`MessageGenerator (${this.flowId}) stopping message generation`);
    this.isGenerating = false;
  }

  private setMessageSize(size: number): void {
    this.logger.log(`MessageGenerator (${this.flowId}) setting message size to ${size} bytes`);
    this.messageSize = size;
  }
}