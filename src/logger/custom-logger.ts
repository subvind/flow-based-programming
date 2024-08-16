import { Logger, Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class CustomLogger extends Logger {
  constructor(
    private componentId: string,
    @Inject('FLOW_SERVICE') private client: ClientProxy
  ) {
    super(componentId);
  }

  log(message: string, context?: string) {
    super.log(message, context);
    this.emitLogEvent('log', message);
  }

  warn(message: string, context?: string) {
    super.warn(message, context);
    this.emitLogEvent('warn', message);
  }

  error(message: string, trace?: string, context?: string) {
    super.error(message, trace, context);
    this.emitLogEvent('error', message);
  }

  private async emitLogEvent(level: string, message: string) {
    await this.client.emit('componentEvent', {
      componentId: this.componentId,
      eventName: 'logger',
      data: {
        level,
        message,
      },
    }).toPromise();
  }
}
