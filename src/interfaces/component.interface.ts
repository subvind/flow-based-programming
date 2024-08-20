export interface Component {
  id: string;
  name: string;
  description?: string;
  flowId: string;
  componentId: string;
  handleEvent: (eventName: string, data: any) => Promise<void>;
  emitEvent: (flowId: string, eventName: string, data: any) => Promise<void>;
}