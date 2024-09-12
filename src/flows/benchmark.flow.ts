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
      dataPoint: {},
      setMessageSize: {}
    },
    outputs: {
      benchmarkResult: {}
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
          'set-stop': {},
          'set-next': {}
        },
        outputs: {
          'get-start': {},
          'get-stop': {},
          'get-next': {},
          stateChanged: {}
        }
      }
    }
  }
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
      to: 'components.gen.messageGenerator.ports.inputs.start'
    },
    {
      from: 'components.jsm.jobStateMachine.ports.outputs.get-stop',
      to: 'components.gen.messageGenerator.ports.inputs.stop'
    },
    {
      from: 'components.jsm.jobStateMachine.ports.outputs.get-next',
      to: 'components.gen.messageGenerator.ports.inputs.setMessageSize'
    },
    {
      from: 'components.jsm.jobStateMachine.ports.outputs.get-next',
      to: 'components.analyzer.benchmarkAnalyzer.ports.inputs.setMessageSize'
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
      from: 'components.jsm.jobStateMachine.ports.outputs.get-start',
      to: 'components.analyzer.benchmarkAnalyzer.ports.inputs.startBenchmark'
    },
    {
      from: 'components.jsm.jobStateMachine.ports.outputs.get-stop',
      to: 'components.analyzer.benchmarkAnalyzer.ports.inputs.endBenchmark'
    }
  ]
};

export default schema(flow);