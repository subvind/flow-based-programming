export interface Flow {
  id: string;
  components: {
    id: string;
    componentId: string;
  }[];
  connections: {
    fromComponent: string;
    fromEvent: string;
    toComponent: string;
    toEvent: string;
  }[];
}