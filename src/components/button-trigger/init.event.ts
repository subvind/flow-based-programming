import { Connection } from "src/interfaces/connection.interface";
import { ButtonTriggerComponent } from "./button-trigger.handler";
import { Port } from "src/interfaces/port.interface";

// networks of black box processes, which exchange data
// across predefined connections by message passing
export async function init(process: ButtonTriggerComponent, message: any): Promise<void> {
  process.logger.log(`Initializing ButtonTriggerComponent with message: ${JSON.stringify(message)}`);
  
  // define target variables
  let targetFlow, targetComponent, targetEvent;

  // Get buttonPressed target ids
  await process.getPorts();
  process._ports.outputs.forEach((output: Port) => {
    if (output.eventId === 'buttonPressed') {
      output.connections.forEach(async (connection: Connection) => {
        // TODO: btn should account for more than just 1 connected component
        targetFlow = connection.toFlow;
        targetComponent = connection.toComponent;
        targetEvent = connection.toEvent;
      })
    }
  });

  // allow template to be defined within init message or component
  let template = process.template;
  if (message && message.template) {
    template = message.template;
    process.template = template;
  }

  setTimeout(async() => {
    // Send HTMX update for button-trigger template
    await process.display(process.flowId, process.componentId, template, {
      lastPressed: null, // No button press yet
      targetFlow,
      targetComponent,
      targetEvent
    });
  }, 1000)
}