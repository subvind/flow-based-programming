export async function triggerEvent(process, message): Promise<void> {
  const { _flowId, _componentId, _eventId } = message;
  return await process.publish(_flowId, _componentId, _eventId, message);
}