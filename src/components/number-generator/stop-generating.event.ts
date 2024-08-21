export function stopGenerating(flow, data) {
  flow.logger.log(`NumberGenerator (${flow.flowId}) stopGenerating method called`);
  if (flow.interval) {
    clearInterval(flow.interval);
    flow.interval = null;
  }
}