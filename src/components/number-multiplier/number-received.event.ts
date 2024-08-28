import { NumberMultiplierComponent } from "./number-multiplier.handler";

// networks of black box processes, which exchange data
// across predefined connections by message passing
export async function numberReceived (process: NumberMultiplierComponent, message: any) {
  const fid = process.flowId;
  const cid = process.componentId;

  const inputNumber = typeof message === 'number' ? message : parseFloat(message);
  if (isNaN(inputNumber)) {
    process.logger.warn(`Received invalid number: ${JSON.stringify(message, null, 2)}`);
    return;
  }
  const result = inputNumber * 2;
  process.logger.log(`NumberMultiplier received ${inputNumber}, multiplied result: ${result}`);
  await process.publish(fid, cid, 'numberMultiplied', result);

  // Send HTMX update
  await process.display(fid, cid, 'number-multiplier', {
    input: inputNumber,
    result: result,
    timestamp: Date.now()
  });
}