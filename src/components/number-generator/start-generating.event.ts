export function startGenerating (process, message) {
  const fid = process.flowId;
  const cid = process.componentId;

  process.logger.log(`NumberGenerator (${process.flowId}) startGenerating method called`);
  if (process.interval) {
    clearInterval(process.interval);
  }
  process.interval = setInterval(async () => {
    var randomNumber = Math.random();
    process.logger.log(`NumberGenerator (${process.flowId}) generated number: ${randomNumber}`);
    await process.publish(fid, cid, 'numberGenerated', randomNumber);
    
    // Send HTMX update
    await process.display(fid, cid, 'number-generator', {
      number: randomNumber,
      timestamp: Date.now()
    });
  }, 1000);
}