import { NumberMultiplierComponent } from "./number-multiplier.handler";

// networks of black box processes, which exchange data
// across predefined connections by message passing
export async function numberReceived(process: NumberMultiplierComponent, message: any, which: 'first' | 'second') {
  const fid = process.flowId;
  const cid = process.componentId;

  const inputNumber = typeof message === 'number' ? message : parseFloat(message);
  if (isNaN(inputNumber)) {
    process.logger.warn(`Received invalid number: ${JSON.stringify(message, null, 2)}`);
    return;
  }

  if (which === 'first') {
    process.firstNumber = inputNumber;
  } else {
    process.secondNumber = inputNumber;
  }

  process.logger.log(`NumberMultiplier received ${which} number: ${inputNumber}`);

  if (process.firstNumber !== null && process.secondNumber !== null) {
    const result = process.firstNumber * process.secondNumber;
    process.logger.log(`NumberMultiplier multiplied result: ${result}`);
    await process.publish(fid, cid, 'numberMultiplied', result);

    // Send HTMX update
    await process.display(fid, cid, 'number-multiplier', {
      firstNumber: process.firstNumber,
      secondNumber: process.secondNumber,
      result: result,
      timestamp: Date.now()
    });

    // Reset the numbers after multiplication
    process.firstNumber = null;
    process.secondNumber = null;
  }
}