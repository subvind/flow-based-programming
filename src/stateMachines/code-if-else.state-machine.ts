export default {
  initialState: 'evaluatingCondition',
  states: ['evaluatingCondition', 'executingThen', 'executingElse', 'completed', 'error'],
  transitions: {
    evaluatingCondition: { conditionTrue: 'executingThen', conditionFalse: 'executingElse', fail: 'error' },
    executingThen: { complete: 'completed', fail: 'error' },
    executingElse: { complete: 'completed', fail: 'error' },
    completed: { reset: 'evaluatingCondition' },
    error: { reset: 'evaluatingCondition' }
  }
}
