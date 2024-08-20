import { Injectable } from '@nestjs/common';
import { ComponentService } from '../base.component';

@Injectable()
export class NumberGeneratorComponent extends ComponentService {
  private interval: NodeJS.Timeout | null = null;

  constructor(flowId: string) {
    super('numberGenerator', 'Number Generator', 'Generates random numbers periodically', flowId);
  }

  async handleEvent(eventName: string, data: any): Promise<void> {
    this.logger.log(`NumberGenerator (${this.flowId}) handling event: ${eventName}`);
    if (eventName === 'start') {
      this.logger.log(`NumberGenerator (${this.flowId}) starting number generation`);
      this.startGenerating();
    } else if (eventName === 'stop') {
      this.logger.log(`NumberGenerator (${this.flowId}) stopping number generation`);
      this.stopGenerating();
    }
  }

  private startGenerating() {
    this.logger.log(`NumberGenerator (${this.flowId}) startGenerating method called`);
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.interval = setInterval(async () => {
      const randomNumber = Math.random();
      this.logger.log(`NumberGenerator (${this.flowId}) generated number: ${randomNumber}`);
      await this.emitEvent('numberGenerated', randomNumber);
      
      // Send HTMX update
      await this.sendHtmxUpdate({
        number: randomNumber,
        timestamp: Date.now(),
        flowId: this.flowId
      }, 'number-generator');
    }, 1000);
  }

  private stopGenerating() {
    this.logger.log(`NumberGenerator (${this.flowId}) stopGenerating method called`);
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}