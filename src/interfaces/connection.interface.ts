import { Component } from "./component.interface";

export interface Connection {
  toFlow: string;
  toComponent: string;
  toEvent: string;
  connectedTo: Component | undefined;
  fromFlow: string;
  fromComponent: string;
  fromEvent: string;
  connectedFrom: Component | undefined;
}