import { StateMachine } from "src/interfaces/state-machine.interface";

// networks of black box processes, which exchange data
// across predefined connections by message passing
export async function initProxyMachine(process, message): Promise<void> {
  await process.getPorts();
  for (const input of process._ports.inputs) {
    // console.log('input', input)
    for (const connection of input.connections) {
      // console.log('connection', connection)
      const smComponent = connection.connectedFrom as StateMachine;
      if (smComponent) {
        // console.log('smComponent', smComponent)
        process.stateMachine = smComponent;
        // console.log(process.stateMachine.componentId);
        break; // We only need to initialize one state machine
      }
    }
    if (process.stateMachine) break; // Exit if we've found and initialized a state machine
  }
  if (!process.stateMachine) {
    process.logger.error('No valid state machine component found');
  }
}