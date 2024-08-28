import { NumberGeneratorComponent } from "./number-generator.handler";

// networks of black box processes, which exchange data
// across predefined connections by message passing
export function stopGenerating(process: NumberGeneratorComponent, message: any) {
  process.logger.log(`NumberGenerator (${process.flowId}) stopGenerating method called`);
  if (process.interval) {
    clearInterval(process.interval);
    process.interval = null;
  }
}