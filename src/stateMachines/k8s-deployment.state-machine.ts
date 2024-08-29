export default {
  initialState: 'pending',
  states: ['pending', 'creating', 'scaling', 'updating', 'stable', 'failing', 'deleting'],
  transitions: {
    pending: { start: 'creating' },
    creating: { 
      created: 'stable',
      failed: 'failing'
    },
    stable: { 
      scale: 'scaling',
      update: 'updating',
      delete: 'deleting'
    },
    scaling: {
      scaled: 'stable',
      failed: 'failing'
    },
    updating: {
      updated: 'stable',
      failed: 'failing'
    },
    failing: { 
      retry: 'pending',
      delete: 'deleting'
    },
    deleting: {
      deleted: 'pending',
      failed: 'failing'
    }
  }
}