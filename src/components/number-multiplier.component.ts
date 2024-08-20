import { Injectable, Logger } from '@nestjs/common';
import { ComponentService } from '../base.component';

@Injectable()
export class NumberMultiplierComponent extends ComponentService {
  constructor(flowId: string) {
    super('numberMultiplier', 'Number Multiplier', 'Multiplies received number by 2', flowId);
  }

  async handleEvent(eventName: string, data: any): Promise<void> {
    this.logger.log(`NumberMultiplier handling event: ${eventName}`);
    if (eventName === 'numberReceived') {
      const result = data * 2;
      this.logger.log(`NumberMultiplier received ${data}, multiplied result: ${result}`);
      await this.emitEvent('numberMultiplied', result);

      // Send HTMX update
      await this.sendHtmxUpdate({
        input: data,
        result: result,
        timestamp: Date.now()
      }, 'number-multiplier');
    }
  }
}