import { schema } from "../schema/flow.schema"; 
import { default as jobStateMachine } from "src/stateMachines/job.state-machine";

let numberGenerator = {
  events: {
    start: {},
    stop: {},
    numberGenerated: {}
  }
}

let buttonTrigger = {
  events: {
    triggerButton: {},
    buttonPressed: {}
  }
}

let components = {
  main: {
    eventTrigger: {
      events: {}
    }
  },
  btn1: { buttonTrigger },
  btn2: { buttonTrigger },
  btn3: { buttonTrigger },
  btn4: { buttonTrigger },
  btn5: { buttonTrigger },
  sm1: {
    stateMachine: {
      init: jobStateMachine,
      events: {
        initializeMachine: {}
      }
    }
  },
  jsm1: {
    jobStateMachine: {
      events: {
        initializeMachine: {},
        start: {},
        pause: {},
        resume: {},
        finish: {},
        reset: {}
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
      from: 'components.sm1.stateMachine.events.initializeMachine',
      to: 'components.jsm1.jobStateMachine.events.initializeMachine'
    },
    {
      from: 'components.jsm1.jobStateMachine.events.start',
      to: 'components.gen1.numberGenerator.events.start'
    },
    {
      from: 'components.jsm1.jobStateMachine.events.stop',
      to: 'components.gen1.numberGenerator.events.stop'
    },
    {
      from: 'components.jsm1.jobStateMachine.events.start',
      to: 'components.gen2.numberGenerator.events.start'
    },
    {
      from: 'components.jsm1.jobStateMachine.events.stop',
      to: 'components.gen2.numberGenerator.events.stop'
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
      from: 'components.btn1.buttonTrigger.events.buttonPressed',
      to: 'components.jsm1.jobStateMachine.events.start'
    },
    {
      from: 'components.btn2.buttonTrigger.events.buttonPressed',
      to: 'components.jsm1.jobStateMachine.events.pause'
    },
    {
      from: 'components.btn3.buttonTrigger.events.buttonPressed',
      to: 'components.jsm1.jobStateMachine.events.resume'
    },
    {
      from: 'components.btn4.buttonTrigger.events.buttonPressed',
      to: 'components.jsm1.jobStateMachine.events.finish'
    },
    {
      from: 'components.btn5.buttonTrigger.events.buttonPressed',
      to: 'components.jsm1.jobStateMachine.events.reset'
    },
  ]
};

export default schema(flow);