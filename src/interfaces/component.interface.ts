export interface Component {
  ports: { inputs: string[]; outputs: string[]; };
  componentRef: string;
  name: string;
  description?: string;
  flowId: string;
  componentId: string;
  handleEvent: (eventId: string, data: any) => Promise<void>;
  publish: (flowId: string, componentId: string, eventId: string, data: any) => Promise<void>;
}