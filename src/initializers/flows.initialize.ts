import { exampleFlow } from "src/flows/example-flow.flow";

const flows = [
  exampleFlow
];

export async function initializeFlows(flowExecutor) {
  flows.forEach(async (flow) => {
    await flowExecutor.executeFlow(flow);
  })
}