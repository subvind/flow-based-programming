import { EventTriggerComponent } from "./event-trigger.handler";

// networks of black box processes, which exchange data
// across predefined connections by message passing
export async function triggerEvent(process: EventTriggerComponent, message: any): Promise<void> {
  const { _flowId, _componentId, _eventId } = message;
  return await process.publish(_flowId, _componentId, _eventId, message);
}