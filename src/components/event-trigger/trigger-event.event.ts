export async function triggerEvent(flow, data): Promise<void> {
  const { _flowId, _componentId, _eventId } = data;
  return await flow.publish(_flowId, _componentId, _eventId, data);
}