import { schema } from "../schema/flow.schema";
import { default as initJobStateMachine } from "src/stateMachines/job.state-machine";

let messageGenerator = {
  ports: {
    inputs: {
      start: {},
      stop: {},
      setMessageSize: {}
    },
    outputs: {
      messageGenerated: {}
    }
  }
}

let messageProcessor = {
  ports: {
    inputs: {
      messageReceived: {}
    },
    outputs: {
      processingComplete: {}
    }
  }
}

let benchmarkAnalyzer = {
  ports: {
    inputs: {
      startBenchmark: {},
      endBenchmark: {},
      dataPoint: {}
    },
    outputs: {
      benchmarkResult: {},
      startMessageGeneration: {},
      stopMessageGeneration: {},
      nextMessageSize: {}
    }
  },
  init: {
    messageSizes: [1, 10, 100, 1000, 10000],
    messagesPerSize: 500
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
  gen: {
    messageGenerator
  },
  proc: {
    messageProcessor
  },
  analyzer: {
    benchmarkAnalyzer
  },
  sm: {
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
  jsm: {
    jobStateMachine: {
      ports: {
        inputs: {
          initProxyMachine: {},
          'set-start': {},
          'set-pause': {},
          'set-resume': {},
          'set-finish': {},
          'set-reset': {}
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
  },
  startBtn: { buttonTrigger },
  stopBtn: { buttonTrigger },
}

let flow = {
  id: 'benchmark-flow',
  components,
  connections: [
    {
      from: 'components.sm.stateMachine.ports.outputs.initProxyMachine',
      to: 'components.jsm.jobStateMachine.ports.inputs.initProxyMachine'
    },
    {
      from: 'components.jsm.jobStateMachine.ports.outputs.get-start',
      to: 'components.analyzer.benchmarkAnalyzer.ports.inputs.startBenchmark'
    },
    {
      from: 'components.analyzer.benchmarkAnalyzer.ports.outputs.nextMessageSize',
      to: 'components.gen.messageGenerator.ports.inputs.setMessageSize'
    },
    {
      from: 'components.jsm.jobStateMachine.ports.outputs.get-resume',
      to: 'components.analyzer.benchmarkAnalyzer.ports.inputs.startBenchmark'
    },
    {
      from: 'components.jsm.jobStateMachine.ports.outputs.get-finish',
      to: 'components.analyzer.benchmarkAnalyzer.ports.inputs.endBenchmark'
    },
    {
      from: 'components.jsm.jobStateMachine.ports.outputs.get-reset',
      to: 'components.analyzer.benchmarkAnalyzer.ports.inputs.startBenchmark'
    },
    {
      from: 'components.gen.messageGenerator.ports.outputs.messageGenerated',
      to: 'components.proc.messageProcessor.ports.inputs.messageReceived'
    },
    {
      from: 'components.proc.messageProcessor.ports.outputs.processingComplete',
      to: 'components.analyzer.benchmarkAnalyzer.ports.inputs.dataPoint'
    },
    {
      from: 'components.analyzer.benchmarkAnalyzer.ports.outputs.startMessageGeneration',
      to: 'components.gen.messageGenerator.ports.inputs.start'
    },
    {
      from: 'components.analyzer.benchmarkAnalyzer.ports.outputs.stopMessageGeneration',
      to: 'components.gen.messageGenerator.ports.inputs.stop'
    },
    {
      from: 'components.startBtn.buttonTrigger.ports.outputs.buttonPressed',
      to: 'components.jsm.jobStateMachine.ports.inputs.set-start'
    },
    {
      from: 'components.stopBtn.buttonTrigger.ports.outputs.buttonPressed',
      to: 'components.jsm.jobStateMachine.ports.inputs.set-finish'
    }
  ]
};

export default schema(flow);