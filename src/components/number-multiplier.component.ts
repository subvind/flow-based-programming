import { Injectable, Logger } from '@nestjs/common';
import { ComponentService } from '../base.component';

@Injectable()
export class NumberMultiplierComponent extends ComponentService {
  constructor() {
    super('numberMultiplier', 'Number Multiplier', 'Multiplies received number by 2');
  }

  async handleEvent(eventName: string, data: any): Promise<void> {
    this.logger.log(`Handling event: ${eventName}`);
    if (eventName === 'numberReceived') {
      const result = data * 2;
      this.logger.log(`Emitting numberMultiplied event: ${result}`);
      await this.emitEvent('numberMultiplied', result);
    }
  }
}