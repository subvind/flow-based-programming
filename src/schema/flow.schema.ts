import { Flow } from "../interfaces/flow.interface";

export function schema(flow: any): Flow {
  const components = Object.entries(flow.components).map(([componentId, component]) => {
    const [componentRef] = Object.keys(component);
    let init;
    if (componentRef === 'stateMachine' && component[componentRef].init) {
      init = component[componentRef].init;
    }
    return { componentId, componentRef, init };
  });

  const connections = flow.connections.map((connection) => {
    const fromParts = connection.from.split('.');
    const toParts = connection.to.split('.');

    // 0          1    2            3      4
    // components.main.eventTrigger.events.initializeMachine
    
    return {
      fromFlow: flow.id,
      fromComponent: fromParts[1],
      fromEvent: fromParts[4],
      toFlow: flow.id,
      toComponent: toParts[1],
      toEvent: toParts[4],
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