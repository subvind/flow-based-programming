export default {
  initialState: 'idle',
  states: ['idle', 'building', 'testing', 'deploying', 'succeeded', 'failed'],
  transitions: {
    idle: { trigger: 'building' },
    building: {
      buildSuccess: 'testing',
      buildFailure: 'failed'
    },
    testing: {
      testSuccess: 'deploying',
      testFailure: 'failed'
    },
    deploying: {
      deploySuccess: 'succeeded',
      deployFailure: 'failed'
    },
    succeeded: { newTrigger: 'building' },
    failed: { retry: 'building' }
  }
}