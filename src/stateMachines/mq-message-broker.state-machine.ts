export default {
  initialState: 'idle',
  states: ['idle', 'starting', 'running', 'stopped', 'error'],
  transitions: {
    idle: { start: 'starting', fail: 'error' },
    starting: { success: 'running', fail: 'error' },
    running: { stop: 'stopped', fail: 'error' },
    stopped: { restart: 'starting', fail: 'error' },
    error: { reset: 'idle' }
  }
}
