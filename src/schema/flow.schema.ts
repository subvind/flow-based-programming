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

  const connections = flow.connections.map(connection => {
    const paths = extractPaths(flow.components, connection);
    const fromParts = paths.from.split('.');
    const toParts = paths.to.split('.');
    // console.log('fromParts', fromParts)
    // example: main.eventTrigger.events.initializeMachine
    return {
      fromFlow: flow.id,
      fromComponent: fromParts[0],
      fromEvent: fromParts[fromParts.length - 1],
      toFlow: flow.id,
      toComponent: toParts[0],
      toEvent: toParts[toParts.length - 1],
    };
  });

  let code = {
    id: flow.id,
    components,
    connections,
  };

  return code;
}

function getObjectPath(obj, target) {
  for (const [key, value] of Object.entries(obj)) {
    if (value === target) return [key];
    if (typeof value === 'object') {
      const path = getObjectPath(value, target);
      if (path) return [key, ...path];
    }
  }
  return null;
}

function extractPaths(components, connection) {
  const fromPath = getObjectPath(components, connection.from);
  const toPath = getObjectPath(components, connection.to);

  return {
    from: fromPath ? fromPath.join('.') : null,
    to: toPath ? toPath.join('.') : null
  };
}
