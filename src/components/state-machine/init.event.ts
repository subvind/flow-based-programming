import { StateMachineComponent } from './state-machine.handler';

// networks of black box processes, which exchange data
// across predefined connections by message passing
export async function init(process: StateMachineComponent, message: any): Promise<void> {
  return await process.initializeMachine(message);
}