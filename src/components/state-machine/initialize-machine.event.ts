import { StateMachineComponent } from './state-machine.handler';

// networks of black box processes, which exchange data
// across predefined connections by message passing
export async function initializeMachine(process: StateMachineComponent, message: any): Promise<void> {
  const { initialState, states, transitions } = message;

  process.currentState = initialState;
  process.states = new Set(states);
  
  process.transitions = new Map();
  for (const [fromState, events] of Object.entries(transitions)) {
    process.transitions.set(fromState, new Map(Object.entries(events as Record<string, string>)));
  }

  process.logger.log(`State machine initialized with initial state: ${process.currentState}`);
  
  await process.publish(process.flowId, process.componentId, 'stateChanged', { 
    currentState: process.currentState 
  });

  await process.display(process.flowId, process.componentId, 'state-machine', {
    currentState: process.currentState,
    states: Array.from(process.states),
    transitions: Object.fromEntries(process.transitions)
  });
}