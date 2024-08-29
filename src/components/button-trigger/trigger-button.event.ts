import { ButtonTriggerComponent } from "./button-trigger.handler";

// networks of black box processes, which exchange data
// across predefined connections by message passing
export async function triggerButton(process: ButtonTriggerComponent, message: any): Promise<void> {
  const { _flowId, _componentId, _eventId, targetFlow, targetComponent, targetEvent } = message;
  
  // Log the button press
  process.logger.log(`Button pressed: ${_flowId}.${_componentId}.${_eventId}`);

  // Publish the button press event
  await process.publish(_flowId, _componentId, 'buttonPressed', { 
    pressedAt: new Date().toISOString(),
    targetFlow,
    targetComponent,
    targetEvent
  });

  // Trigger the target event (usually on a state machine)
  await process.publish(targetFlow, targetComponent, targetEvent, {
    source: `${_flowId}.${_componentId}`,
    pressedAt: new Date().toISOString()
  });

  // allow template to be defined within init message or component
  let template = 'button-trigger';
  if (process.template) {
    template = process.template;
  }

  // Update the UI
  await process.display(_flowId, _componentId, template, {
    lastPressed: new Date().toISOString(),
    targetFlow,
    targetComponent,
    targetEvent
  });
}