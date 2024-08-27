import { Connection } from "./connection.interface";

export interface Flow {
  id: string;
  components: {
    componentId: string;
    componentRef: string;
  }[];
  connections: Connection[];
}