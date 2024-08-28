import { StateMachineComponent } from './state-machine.handler';

// networks of black box processes, which exchange data
// across predefined connections by message passing
export async function transition(process: StateMachineComponent, message: any): Promise<void> {
  const { event } = message;
  const currentState = process.currentState;

  const stateTransitions = process.transitions.get(currentState);
  if (!stateTransitions) {
    process.logger.warn(`No transitions defined for state: ${currentState}`);
    return;
  }

  const nextState = stateTransitions.get(event);
  if (!nextState) {
    process.logger.warn(`No transition defined for event '${event}' in state '${currentState}'`);
    return;
  }

  process.currentState = nextState;
  process.logger.log(`Transitioned from '${currentState}' to '${nextState}' on event '${event}'`);

  await process.publish(process.flowId, process.componentId, 'stateChanged', { 
    previousState: currentState,
    currentState: process.currentState,
    event
  });

  await process.display(process.flowId, process.componentId, 'state-machine', {
    currentState: process.currentState,
    states: Array.from(process.states),
    transitions: Object.fromEntries(process.transitions)
  });
}