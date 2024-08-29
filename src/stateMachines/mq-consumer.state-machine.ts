export default {
  initialState: 'idle',
  states: ['idle', 'ready', 'consuming', 'completed', 'error'],
  transitions: {
    idle: { subscribe: 'ready', fail: 'error' },
    ready: { consumeMessage: 'consuming', unsubscribe: 'idle', fail: 'error' },
    consuming: { ack: 'completed', nack: 'completed', fail: 'error' },
    completed: { reset: 'ready' },
    error: { reset: 'idle' }
  }
}
