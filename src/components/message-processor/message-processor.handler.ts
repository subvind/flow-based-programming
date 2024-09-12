import { CustomLogger } from '../../logger/custom-logger';
import { Injectable, Inject } from '@nestjs/common';
import { ComponentBase } from '../../bases/component.base';
import { BackplaneService } from 'src/services/backplane.service';
import { Server } from 'socket.io';
import { TemplateCacheService } from 'src/services/template-cache.service';

@Injectable()
export class MessageProcessorComponent extends ComponentBase {
  public logger;
  public ports = {
    inputs: [
      'any.publish.messageReceived'
    ],
    outputs: [
      'any.publish.processingComplete'
    ]
  }

  constructor(
    @Inject('FLOW_ID') flowId: string,
    @Inject('COMPONENT_ID') componentId: string,
    @Inject(BackplaneService) backplane: BackplaneService,
    @Inject('WEB_SOCKET_SERVER') protected server: Server,
    @Inject('TEMPLATES') templates: TemplateCacheService
  ) {
    super('messageProcessor', 'message-processor', 'Processes messages for benchmarking', flowId, componentId, backplane, server, templates);
    this.flowId = flowId;
    this.componentId = componentId;
    this.logger = new CustomLogger(`${flowId}.${componentId}`);
  }

  async handleEvent(eventId: string, data: any): Promise<void> {
    // this.logger.log(`MessageProcessor (${this.flowId}) handling event: ${eventId}`);
    switch (eventId) {
      case "messageReceived": {
        await this.processMessage(data);
        break;
      }
    }
  }

  private async processMessage(message: any): Promise<void> {
    const processingTime = Date.now() - message.timestamp;
    await this.publish(this.flowId, this.componentId, 'processingComplete', { processingTime });
  }
}