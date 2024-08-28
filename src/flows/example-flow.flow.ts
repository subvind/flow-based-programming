import { FlowBase } from "../bases/flow.base"

export default {
  id: 'example-flow',
  components: [
    { componentId: 'main', componentRef: 'eventTrigger' },
    { componentId: 'gen1', componentRef: 'numberGenerator' },
    { componentId: 'mult1', componentRef: 'numberMultiplier' },
  ],
  connections: [
    {
      fromComponent: 'gen1',
      fromEvent: 'numberGenerated',
      toComponent: 'mult1',
      toEvent: 'numberReceived',
    },
  ],
}