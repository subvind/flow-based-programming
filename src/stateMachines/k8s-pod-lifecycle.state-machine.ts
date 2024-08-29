export default {
  initialState: 'pending',
  states: ['pending', 'creating', 'running', 'succeeded', 'failed', 'unknown', 'terminating'],
  transitions: {
    pending: { scheduled: 'creating' },
    creating: { 
      containerCreated: 'running',
      failed: 'failed'
    },
    running: {
      completed: 'succeeded',
      error: 'failed',
      deleted: 'terminating'
    },
    succeeded: { cleanup: 'terminating' },
    failed: { 
      restart: 'pending',
      cleanup: 'terminating'
    },
    unknown: { 
      detected: 'running',
      timeout: 'failed'
    },
    terminating: { finalized: 'pending' }
  }
}