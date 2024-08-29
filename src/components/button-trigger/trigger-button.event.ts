import { ButtonTriggerComponent } from "./button-trigger.handler";

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

  // Update the UI
  await process.display(_flowId, _componentId, 'button-trigger', {
    lastPressed: new Date().toISOString(),
    targetFlow,
    targetComponent,
    targetEvent
  });
}