export default {
  initialState: 'stable',
  states: ['stable', 'scaling_out', 'scaling_in', 'failing'],
  transitions: {
    stable: {
      high_load: 'scaling_out',
      low_load: 'scaling_in'
    },
    scaling_out: {
      success: 'stable',
      failure: 'failing'
    },
    scaling_in: {
      success: 'stable',
      failure: 'failing'
    },
    failing: {
      resolved: 'stable',
      retry: 'stable'
    }
  }
}