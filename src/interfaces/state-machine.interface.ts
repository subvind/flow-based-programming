import { Component } from "./component.interface";

export interface StateMachine extends Component {
  transition: (data: any) => Promise<void>;
  initStateMachine: (data: any) => Promise<void>;
  getCurrentState: () => string;
  getStates: () => Set<string>;
  getTransitions: () => Map<string, Map<string, string>>;
}