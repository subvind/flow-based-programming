export default {
  initialState: 'unregistered',
  states: ['unregistered', 'registering', 'registered', 'updating', 'deregistering'],
  transitions: {
    unregistered: { register: 'registering' },
    registering: {
      success: 'registered',
      failure: 'unregistered'
    },
    registered: {
      update: 'updating',
      deregister: 'deregistering'
    },
    updating: {
      success: 'registered',
      failure: 'deregistering'
    },
    deregistering: { 
      success: 'unregistered',
      failure: 'registered'
    }
  }
}