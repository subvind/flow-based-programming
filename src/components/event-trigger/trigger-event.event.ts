export async function triggerEvent(flow, data): Promise<void> {
  const { flowId, componentId, eventId } = data;
  return await flow.publish(flowId, componentId, eventId, data);
}