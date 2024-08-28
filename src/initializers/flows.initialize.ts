import { FlowBase } from "src/bases/flow.base";

import {default as exampleFlow} from "src/flows/example-flow.flow";

const flows = [
  new FlowBase(exampleFlow.id, exampleFlow.components, exampleFlow.connections),
];

export async function initializeFlows(flowExecutor) {
  flows.forEach(async (flow) => {
    await flowExecutor.executeFlow(flow);
  })
}