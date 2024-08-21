export function startGenerating (flow, data) {
  flow.logger.log(`NumberGenerator (${flow.flowId}) startGenerating method called`);
  if (flow.interval) {
    clearInterval(flow.interval);
  }
  flow.interval = setInterval(async () => {
    var randomNumber = Math.random();
    flow.logger.log(`NumberGenerator (${flow.flowId}) generated number: ${randomNumber}`);
    await flow.publish(flow.flowId, flow.componentId, 'numberGenerated', randomNumber);
    
    // Send HTMX update
    await flow.sendHtmxUpdate('number-generator', {
      number: randomNumber,
      timestamp: Date.now(),
      flowId: flow.flowId,
      componentId: flow.componentId
    });
  }, 1000);
}