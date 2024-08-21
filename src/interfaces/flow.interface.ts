export interface Flow {
  id: string;
  components: {
    componentId: string;
    componentRef: string;
  }[];
  connections: {
    fromComponent: string;
    fromEvent: string;
    toComponent: string;
    toEvent: string;
  }[];
}