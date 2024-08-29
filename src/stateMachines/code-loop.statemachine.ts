export default {
  initialState: 'initialize',
  states: ['initialize', 'condition', 'body', 'increment', 'complete'],
  transitions: {
    initialize: { next: 'condition' },
    condition: { 
      conditionTrue: 'body',
      conditionFalse: 'complete'
    },
    body: { next: 'increment' },
    increment: { next: 'condition' },
    complete: { reset: 'initialize' }
  }
}