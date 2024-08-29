export default {
  initialState: 'disconnected',
  states: ['disconnected', 'connecting', 'connected', 'error'],
  transitions: {
    disconnected: { connect: 'connecting', fail: 'error' },
    connecting: { success: 'connected', fail: 'error' },
    connected: { disconnect: 'disconnected', fail: 'error' },
    error: { reset: 'disconnected' }
  }
}
