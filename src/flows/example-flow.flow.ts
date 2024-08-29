import { schema } from "../schema/flow.schema"; 
import { default as jobStateMachine } from "src/stateMachines/job.state-machine";

let numberGenerator = {
  ports: {
    inputs: {
      start: {},
      stop: {}
    },
    outputs: {
      numberGenerated: {}
    }
  }
}

let buttonTrigger = {
  ports: {
    inputs: {
      triggerButton: {}
    },
    outputs: {
      buttonPressed: {}
    }
  }
}

let components = {
  main: {
    eventTrigger: {
      ports: {
        inputs: {},
        outputs: {}
      }
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
      ports: {
        inputs: {
          initializeMachine: {}
        },
        outputs: {}
      }
    }
  },
  jsm1: {
    jobStateMachine: {
      ports: {
        inputs: {
          initializeMachine: {},
          start: {},
          pause: {},
          resume: {},
          finish: {},
          reset: {}
        },
        outputs: {
          stateChanged: {}
        }
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
      ports: {
        inputs: {
          firstNumberReceived: {},
          secondNumberReceived: {}
        },
        outputs: {
          numberMultiplied: {}
        }
      }
    }
  }
}

let flow = {
  id: 'example-flow',
  components,
  connections: [
    {
      from: 'components.sm1.stateMachine.ports.outputs.initializeMachine',
      to: 'components.jsm1.jobStateMachine.ports.inputs.initializeMachine'
    },
    {
      from: 'components.jsm1.jobStateMachine.ports.outputs.stateChanged',
      to: 'components.gen1.numberGenerator.ports.inputs.start'
    },
    {
      from: 'components.jsm1.jobStateMachine.ports.outputs.stateChanged',
      to: 'components.gen1.numberGenerator.ports.inputs.stop'
    },
    {
      from: 'components.jsm1.jobStateMachine.ports.outputs.stateChanged',
      to: 'components.gen2.numberGenerator.ports.inputs.start'
    },
    {
      from: 'components.jsm1.jobStateMachine.ports.outputs.stateChanged',
      to: 'components.gen2.numberGenerator.ports.inputs.stop'
    },
    {
      from: 'components.gen1.numberGenerator.ports.outputs.numberGenerated',
      to: 'components.multi.numberMultiplier.ports.inputs.firstNumberReceived'
    },
    {
      from: 'components.gen2.numberGenerator.ports.outputs.numberGenerated',
      to: 'components.multi.numberMultiplier.ports.inputs.secondNumberReceived'
    },
    {
      from: 'components.btn1.buttonTrigger.ports.outputs.buttonPressed',
      to: 'components.jsm1.jobStateMachine.ports.inputs.start'
    },
    {
      from: 'components.btn2.buttonTrigger.ports.outputs.buttonPressed',
      to: 'components.jsm1.jobStateMachine.ports.inputs.pause'
    },
    {
      from: 'components.btn3.buttonTrigger.ports.outputs.buttonPressed',
      to: 'components.jsm1.jobStateMachine.ports.inputs.resume'
    },
    {
      from: 'components.btn4.buttonTrigger.ports.outputs.buttonPressed',
      to: 'components.jsm1.jobStateMachine.ports.inputs.finish'
    },
    {
      from: 'components.btn5.buttonTrigger.ports.outputs.buttonPressed',
      to: 'components.jsm1.jobStateMachine.ports.inputs.reset'
    },
  ]
};

export default schema(flow);