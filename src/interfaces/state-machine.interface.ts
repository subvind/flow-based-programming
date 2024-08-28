import { Component } from "./component.interface";

export interface StateMachine extends Component {
  initializeMachine: (data: any) => Promise<void>;
  getCurrentState: () => string;
  getStates: () => Set<string>;
  getTransitions: () => Map<string, Map<string, string>>;
}