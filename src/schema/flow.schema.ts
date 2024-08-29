import { Flow } from "../interfaces/flow.interface";

export function schema(flow: any): Flow {
  const components = Object.entries(flow.components).map(([componentId, component]) => {
    const [componentRef] = Object.keys(component);
    let init;
    let ports = { inputs: [], outputs: [] };

    if (component[componentRef].init) {
      init = component[componentRef].init;
    }

    if (component[componentRef].ports) {
      if (component[componentRef].ports.inputs) {
        ports.inputs = Object.keys(component[componentRef].ports.inputs);
      }
      if (component[componentRef].ports.outputs) {
        ports.outputs = Object.keys(component[componentRef].ports.outputs);
      }
    }

    return { componentId, componentRef, init, ports };
  });

  const connections = flow.connections.map((connection) => {
    const fromParts = connection.from.split('.');
    const toParts = connection.to.split('.');

    // parts format: components.main.eventTrigger.ports.inputs.initializeMachine
    
    return {
      fromFlow: flow.id,
      fromComponent: fromParts[1],
      fromEvent: fromParts[5],
      toFlow: flow.id,
      toComponent: toParts[1],
      toEvent: toParts[5],
    };
  });

  let code = {
    id: flow.id,
    components,
    connections,
  };

  // console.log('code', code);

  return code;
}