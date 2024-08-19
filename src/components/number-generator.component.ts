import { Injectable } from '@nestjs/common';
import { ComponentService } from '../base.component';

@Injectable()
export class NumberGeneratorComponent extends ComponentService {
  private interval: NodeJS.Timeout | null = null;

  constructor() {
    super('numberGenerator', 'Number Generator', 'Generates random numbers periodically');
  }

  async handleEvent(eventName: string, data: any): Promise<void> {
    this.logger.log(`NumberGenerator handling event: ${eventName}`);
    if (eventName === 'start') {
      this.logger.log('NumberGenerator starting number generation');
      this.startGenerating();
    } else if (eventName === 'stop') {
      this.logger.log('NumberGenerator stopping number generation');
      this.stopGenerating();
    }
  }

  private startGenerating() {
    this.logger.log('NumberGenerator startGenerating method called');
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.interval = setInterval(async () => {
      const randomNumber = Math.random();
      this.logger.log(`NumberGenerator generated number: ${randomNumber}`);
      await this.emitEvent('numberGenerated', randomNumber);
      
      // Send HTMX update
      await this.sendHtmxUpdate({
        number: randomNumber,
        timestamp: Date.now()
      }, 'number-generator');
    }, 1000);
  }

  private stopGenerating() {
    this.logger.log('NumberGenerator stopGenerating method called');
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}