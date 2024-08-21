export function startGenerating (flow, data) {
  const fid = flow.flowId;
  const cid = flow.componentId;

  flow.logger.log(`NumberGenerator (${flow.flowId}) startGenerating method called`);
  if (flow.interval) {
    clearInterval(flow.interval);
  }
  flow.interval = setInterval(async () => {
    var randomNumber = Math.random();
    flow.logger.log(`NumberGenerator (${flow.flowId}) generated number: ${randomNumber}`);
    await flow.publish(fid, cid, 'numberGenerated', randomNumber);
    
    // Send HTMX update
    await flow.display(fid, cid, 'number-generator', {
      number: randomNumber,
      timestamp: Date.now()
    });
  }, 1000);
}