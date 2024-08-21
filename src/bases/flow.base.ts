import { Flow } from '../interfaces/flow.interface';

export class FlowService implements Flow {
  constructor(
    public id: string,
    public components: any,
    public connections: any
  ) {
    this.id = id;
    this.components = components;
    this.connections = connections;
  }
};