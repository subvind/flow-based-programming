import { FlowService } from "../bases/flow.base"

export let exampleFlow = new FlowService(
  'example-flow',
  [
    { componentId: 'main', componentRef: 'eventTrigger' },
    { componentId: 'gen1', componentRef: 'numberGenerator' },
    { componentId: 'mult1', componentRef: 'numberMultiplier' },
  ],
  [
    {
      fromComponent: 'gen1',
      fromEvent: 'numberGenerated',
      toComponent: 'mult1',
      toEvent: 'numberReceived',
    },
  ],
)