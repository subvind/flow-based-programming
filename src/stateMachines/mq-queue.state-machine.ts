export default {
  initialState: 'idle',
  states: ['idle', 'binding', 'ready', 'consuming', 'error'],
  transitions: {
    idle: { bindToExchange: 'binding', fail: 'error' },
    binding: { success: 'ready', fail: 'error' },
    ready: { consume: 'consuming', unbind: 'idle', fail: 'error' },
    consuming: { ack: 'ready', nack: 'ready', fail: 'error' },
    error: { reset: 'idle' }
  }
}
