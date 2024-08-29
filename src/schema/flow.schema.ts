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
    const paths = extractPaths(flow.components, connection);
    const fromParts = paths.from.split('.');
    const toParts = paths.to.split('.');

    console.log('fromParts', fromParts)
    console.log('toParts', toParts)
    
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

  console.log('code', code);

  return code;
}

// example
// let components = {
//   main: {
//     eventTrigger: {
//       events: {
//         initializeMachine: {}
//       }
//     }
//   },
// }

function getObjectPath(components, target) {
  for (const [componentId, component] of Object.entries(components)) {
    const [componentRef] = Object.keys(component);
    if (component[componentRef].events) {
      for (const [eventId, event] of Object.entries(component[componentRef].events)) {
        console.log('componentId', componentId)
        console.log('componentRef', componentRef)
        console.log('eventId', eventId)
        console.log(event)
        console.log(target)
        if (event === target) {
          let path = `components.${componentId}.${componentRef}.events.${eventId}`
          console.log(path)
          return path;
        }
      }
    }
  }
  return null;
}

function extractPaths(components, connection) {
  return {
    from: getObjectPath(components, connection.from),
    to: getObjectPath(components, connection.to)
  };
}