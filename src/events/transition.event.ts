// networks of black box processes, which exchange data
// across predefined connections by message passing
export async function transition(process, message): Promise<void> {
  // console.log('process', process.stateMachine)
  if (!process.stateMachine) {
    process.logger.error('[transition] State machine not initialized');
    return;
  }

  const previousState = process.stateMachine.getCurrentState();
  await process.stateMachine.transition({ event: message });
  const currentState = process.stateMachine.getCurrentState();

  await process.updateDisplay();
  
  if (previousState !== currentState) {
    // Publish to the specific event port
    await process.publish(process.flowId, process.componentId, `get-${message}`, { 
      previousState,
      currentState
    });
  
    // Also publish to the general stateChanged port
    await process.publish(process.flowId, process.componentId, 'stateChanged', { 
      previousState,
      currentState,
      message
    });
  }
}