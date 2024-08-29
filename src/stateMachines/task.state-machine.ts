export default {
  initialState: 'idle',
  states: ['idle', 'running', 'suspended', 'terminated'],
  transitions: {
    idle: { start: 'running', terminate: 'terminated' },
    running: { suspend: 'suspended', terminate: 'terminated' },
    suspended: { resume: 'running', terminate: 'terminated' },
    terminated: { reset: 'idle' }
  }
}
