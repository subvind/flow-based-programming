export function schema (flow) {
  
}

// TODO: use ./src/flow/example-flow.flow.ts for reference and
// TODO: turn flow input into to the following format as an output and return it:

// export default {
//   id: 'example-flow',
//   components: [
//     { componentId: 'main', componentRef: 'eventTrigger' },
//     { componentId: 'sm1', componentRef: 'stateMachine', init: jobStateMachine }, // required for jobStateMachine
//     { componentId: 'jsm1', componentRef: 'jobStateMachine' }, // requires stateMachine with init config
//     { componentId: 'gen1', componentRef: 'numberGenerator' },
//     { componentId: 'gen2', componentRef: 'numberGenerator' },
//     { componentId: 'mult1', componentRef: 'numberMultiplier' },
//   ],
//   connections: [
//     // Initialize the job state machine
//     {
//       fromComponent: 'sm1',
//       fromEvent: 'initializeMachine',
//       toComponent: 'jsm1',
//       toEvent: 'initializeMachine',
//     },
//     // Job state machine controls number generators
//     {
//       fromComponent: 'jsm1',
//       fromEvent: 'stateChanged',
//       toComponent: 'gen1',
//       toEvent: 'start',
//     },
//     {
//       fromComponent: 'jsm1',
//       fromEvent: 'stateChanged',
//       toComponent: 'gen2',
//       toEvent: 'start',
//     },
//     // Number generators send numbers to multiplier
//     {
//       fromComponent: 'gen1',
//       fromEvent: 'numberGenerated',
//       toComponent: 'mult1',
//       toEvent: 'firstNumberReceived',
//     },
//     {
//       fromComponent: 'gen2',
//       fromEvent: 'numberGenerated',
//       toComponent: 'mult1',
//       toEvent: 'secondNumberReceived',
//     },
//     // Multiplier result triggers state transition for job state machine
//     {
//       fromComponent: 'mult1',
//       fromEvent: 'numberMultiplied',
//       toComponent: 'jsm1',
//       toEvent: 'finish',
//     },
//   ],
// }