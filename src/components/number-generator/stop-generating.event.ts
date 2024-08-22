export function stopGenerating(process, message) {
  process.logger.log(`NumberGenerator (${process.flowId}) stopGenerating method called`);
  if (process.interval) {
    clearInterval(process.interval);
    process.interval = null;
  }
}