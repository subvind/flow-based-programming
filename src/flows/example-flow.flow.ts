import { schema } from "../schema/flow.schema"; 
import { default as initJobStateMachine } from "src/stateMachines/job.state-machine";

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

let jobStateMachine = {
  ports: {
    inputs: {
      initProxyMachine: {},
      'set-start': {},
      'set-pause': {},
      'set-resume': {},
      'set-finish': {},
      'set-reset': {},
    },
    outputs: {
      'get-start': {},
      'get-pause': {},
      'get-resume': {},
      'get-finish': {},
      'get-reset': {},
      stateChanged: {}
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
      init: initJobStateMachine,
      ports: {
        inputs: {
          initStateMachine: {}
        },
        outputs: {}
      }
    }
  },
  jsm1: { jobStateMachine },
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
      from: 'components.sm1.stateMachine.ports.outputs.initProxyMachine',
      to: 'components.jsm1.jobStateMachine.ports.inputs.initProxyMachine'
    },
    {
      from: 'components.jsm1.jobStateMachine.ports.outputs.get-start',
      to: 'components.gen1.numberGenerator.ports.inputs.start'
    },
    {
      from: 'components.jsm1.jobStateMachine.ports.outputs.get-finish',
      to: 'components.gen1.numberGenerator.ports.inputs.stop'
    },
    {
      from: 'components.jsm1.jobStateMachine.ports.outputs.get-start',
      to: 'components.gen2.numberGenerator.ports.inputs.start'
    },
    {
      from: 'components.jsm1.jobStateMachine.ports.outputs.get-finish',
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
      to: 'components.jsm1.jobStateMachine.ports.inputs.set-start'
    },
    {
      from: 'components.btn2.buttonTrigger.ports.outputs.buttonPressed',
      to: 'components.jsm1.jobStateMachine.ports.inputs.set-pause'
    },
    {
      from: 'components.btn3.buttonTrigger.ports.outputs.buttonPressed',
      to: 'components.jsm1.jobStateMachine.ports.inputs.set-resume'
    },
    {
      from: 'components.btn4.buttonTrigger.ports.outputs.buttonPressed',
      to: 'components.jsm1.jobStateMachine.ports.inputs.set-finish'
    },
    {
      from: 'components.btn5.buttonTrigger.ports.outputs.buttonPressed',
      to: 'components.jsm1.jobStateMachine.ports.inputs.set-reset'
    },
  ]
};

export default schema(flow);