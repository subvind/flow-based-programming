export default {
  initialState: 'idle',
  states: ['idle', 'publishing', 'completed', 'error'],
  transitions: {
    idle: { publishMessage: 'publishing', fail: 'error' },
    publishing: { success: 'completed', fail: 'error' },
    completed: { reset: 'idle' },
    error: { reset: 'idle' }
  }
}
