import { FlowBase } from "src/bases/flow.base";
import { FlowExecutorService } from "src/services/flow-executor.service";

import {default as exampleFlow} from "src/flows/example-flow.flow";
import {default as benchmarkFlow} from "src/flows/benchmark.flow";

const flows = [
  new FlowBase(exampleFlow.id, exampleFlow.components, exampleFlow.connections),
  new FlowBase(benchmarkFlow.id, benchmarkFlow.components, benchmarkFlow.connections),
];

export async function initializeFlows(flowExecutor: FlowExecutorService) {
  flows.forEach(async (flow) => {
    await flowExecutor.executeFlow(flow);
  })
}