export async function numberReceived (flow, data) {
  const fid = flow.flowId;
  const cid = flow.componentId;

  const inputNumber = typeof data === 'number' ? data : parseFloat(data);
  if (isNaN(inputNumber)) {
    flow.logger.warn(`Received invalid number: ${JSON.stringify(data, null, 2)}`);
    return;
  }
  const result = inputNumber * 2;
  flow.logger.log(`NumberMultiplier received ${inputNumber}, multiplied result: ${result}`);
  await flow.publish(fid, cid, 'numberMultiplied', result);

  // Send HTMX update
  await flow.display(fid, cid, 'number-multiplier', {
    input: inputNumber,
    result: result,
    timestamp: Date.now()
  });
}