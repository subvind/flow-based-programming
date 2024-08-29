import { schema } from "../schema/flow.schema"; 
import { default as jobStateMachine } from "src/stateMachines/job.state-machine";

let numberGenerator = {
  events: {
    start: {},
    stop: {},
    numberGenerated: {}
  }
}

let components = {
  main: {
    eventTrigger: {
      events: {
        initializeMachine: {}
      }
    }
  },
  sm1: {
    stateMachine: {
      init: jobStateMachine,
      events: {}
    }
  },
  jsm1: {
    jobStateMachine: {
      events: {
        initializeMachine: {},
        start: {},
        finish: {}
      }
    }
  },
  gen1: {
    numberGenerator
  },
  gen2: {
    numberGenerator
  },
  multi: {
    numberMultiplier: {
      events: {
        numberMultiplied: {},
        firstNumberReceived: {},
        secondNumberReceived: {}
      }
    }
  }
}

let flow = {
  id: 'example-flow',
  components,
  connections: [
    {
      from: 'components.main.eventTrigger.events.initializeMachine',
      to: 'components.jsm1.jobStateMachine.events.initializeMachine'
    },
    {
      from: 'components.jsm1.jobStateMachine.events.start',
      to: 'components.gen1.numberGenerator.events.start'
    },
    {
      from: 'components.jsm1.jobStateMachine.events.start',
      to: 'components.gen2.numberGenerator.events.start'
    },
    {
      from: 'components.gen1.numberGenerator.events.numberGenerated',
      to: 'components.multi.numberMultiplier.events.firstNumberReceived'
    },
    {
      from: 'components.gen2.numberGenerator.events.numberGenerated',
      to: 'components.multi.numberMultiplier.events.secondNumberReceived'
    },
    {
      from: 'components.multi.numberMultiplier.events.numberMultiplied',
      to: 'components.jsm1.jobStateMachine.events.finish'
    }
  ]
};

export default schema(flow);