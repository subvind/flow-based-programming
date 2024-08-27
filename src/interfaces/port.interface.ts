import { Connection } from "./connection.interface";

// portId format: <dataType>.<dataMethod>.<eventId>
export interface Port {
  direction: 'input' | 'output'
  dataType: string;
  dataMethod: 'display' | 'publish';
  eventId: string;
  connections: Connection[];
}