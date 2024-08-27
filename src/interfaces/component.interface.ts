import { Connection } from "./connection.interface";
import { Port } from "./port.interface";

export interface Component {
  ports: { inputs: string[]; outputs: string[]; };
  componentRef: string;
  slug: string;
  description?: string;
  flowId: string;
  componentId: string;
  handleEvent: (eventId: string, data: any) => Promise<void>;
  publish: (flowId: string, componentId: string, eventId: string, data: any) => Promise<void>;
  getPorts: () => Promise<{ inputs: Port[], outputs: Port[] }>;
  findPort: (portId: string) => Promise<Port>;
  findConnections: (port: Port) => Promise<Connection[]>
}