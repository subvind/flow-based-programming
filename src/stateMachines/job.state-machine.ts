export default {
  initialState: 'idle',
  states: ['idle', 'running', 'paused', 'finished'],
  transitions: {
    idle: { start: 'running' },
    running: { pause: 'paused', finish: 'finished' },
    paused: { resume: 'running', finish: 'finished' },
    finished: { reset: 'idle' }
  }
}
