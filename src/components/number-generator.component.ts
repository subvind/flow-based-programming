import { Injectable, Logger } from '@nestjs/common';
import { ComponentService } from './base.component';

@Injectable()
export class NumberGeneratorComponent extends ComponentService {
  constructor() {
    super('numberGenerator', 'Number Generator', 'Generates random numbers periodically');
  }

  async handleEvent(eventName: string, data: any): Promise<void> {
    this.logger.log(`Handling event: ${eventName}`);
    if (eventName === 'start') {
      this.logger.log('Starting number generation');
      setInterval(() => {
        const randomNumber = Math.random();
        this.logger.log(`Emitting numberGenerated event: ${randomNumber}`);
        this.emitEvent('numberGenerated', randomNumber);
      }, 1000);
    }
  }
}