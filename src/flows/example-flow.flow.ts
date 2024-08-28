import { default as jobStateMachine } from "src/stateMachines/job.state-machine";

export default {
  id: 'example-flow',
  components: [
    { componentId: 'main', componentRef: 'eventTrigger' },
    { componentId: 'sm1', componentRef: 'stateMachine', init: jobStateMachine },
    { componentId: 'gen1', componentRef: 'numberGenerator' },
    { componentId: 'gen2', componentRef: 'numberGenerator' },
    { componentId: 'mult1', componentRef: 'numberMultiplier' },
  ],
  connections: [
    // Initialize the state machine
    {
      fromComponent: 'main',
      fromEvent: 'triggerFlow',
      toComponent: 'sm1',
      toEvent: 'initializeMachine',
    },
    // State machine controls number generators
    {
      fromComponent: 'sm1',
      fromEvent: 'stateChanged',
      toComponent: 'gen1',
      toEvent: 'start',
    },
    {
      fromComponent: 'sm1',
      fromEvent: 'stateChanged',
      toComponent: 'gen2',
      toEvent: 'start',
    },
    // Number generators send numbers to multiplier
    {
      fromComponent: 'gen1',
      fromEvent: 'numberGenerated',
      toComponent: 'mult1',
      toEvent: 'firstNumberReceived',
    },
    {
      fromComponent: 'gen2',
      fromEvent: 'numberGenerated',
      toComponent: 'mult1',
      toEvent: 'secondNumberReceived',
    },
    // Multiplier result triggers state transition
    {
      fromComponent: 'mult1',
      fromEvent: 'numberMultiplied',
      toComponent: 'sm1',
      toEvent: 'transition',
    },
  ],
}