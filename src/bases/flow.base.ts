import { Connection } from 'src/interfaces/connection.interface';
import { Flow } from '../interfaces/flow.interface';

export class FlowBase implements Flow {
  public connections: Connection[] = [];
  constructor(
    public id: string,
    public components: any,
    public _connections: {
      fromComponent: string;
      fromEvent: string;
      toComponent: string;
      toEvent: string;
    }[]
  ) {
    this.id = id;
    this.components = components;
    this._connections = _connections;
    this.setupConnections();
  }

  private async setupConnections(): Promise<Connection[]> {
    this._connections.forEach((connection) => {
      let c: Connection = {
        ...connection,
        toFlow: this.id,
        fromFlow: this.id,
        connectedTo: undefined, // TODO
        connectedFrom: undefined // TODO
      }
      this.connections.push(c);
    })
    return this.connections;
  }
};