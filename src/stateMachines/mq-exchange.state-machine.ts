export default {
  initialState: 'idle',
  states: ['idle', 'binding', 'ready', 'error'],
  transitions: {
    idle: { bindQueue: 'binding', fail: 'error' },
    binding: { success: 'ready', fail: 'error' },
    ready: { publish: 'ready', unbindQueue: 'idle', fail: 'error' },
    error: { reset: 'idle' }
  }
}
