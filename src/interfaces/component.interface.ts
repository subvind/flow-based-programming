export interface Component {
  id: string;
  name: string;
  description?: string;
  handleEvent: (eventName: string, data: any) => Promise<void>;
  emitEvent: (eventName: string, data: any) => Promise<void>;
}