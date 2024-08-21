export async function numberReceived (flow, data) {
  const inputNumber = typeof data === 'number' ? data : parseFloat(data);
  if (isNaN(inputNumber)) {
    flow.logger.warn(`Received invalid number: ${JSON.stringify(data, null, 2)}`);
    return;
  }
  const result = inputNumber * 2;
  flow.logger.log(`NumberMultiplier received ${inputNumber}, multiplied result: ${result}`);
  await flow.publish(flow.flowId, flow.componentId, 'numberMultiplied', result);

  // Send HTMX update
  await flow.sendHtmxUpdate('number-multiplier', {
    input: inputNumber,
    result: result,
    timestamp: Date.now()
  });
}