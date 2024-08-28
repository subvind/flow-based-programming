import { CustomLogger } from '../../logger/custom-logger';
import { Injectable, Inject } from '@nestjs/common';
import { ComponentBase } from '../../bases/component.base';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Server } from 'socket.io';

import { init } from './init.event';
import { initializeMachine } from './initialize-machine.event';
import { transition } from './transition.event';

@Injectable()
export class StateMachineComponent extends ComponentBase {
  public logger: CustomLogger;
  public currentState: string;
  public states: Set<string>;
  public transitions: Map<string, Map<string, string>>;
  
  public ports = {
    inputs: [
      'any.publish.initializeMachine',
      'any.publish.transition'
    ],
    outputs: [
      'any.publish.stateChanged',
      'htmx.display.state-machine'
    ]
  }

  constructor(
    @Inject('FLOW_ID') flowId: string,
    @Inject('COMPONENT_ID') componentId: string,
    @Inject(AmqpConnection) amqpConnection: AmqpConnection,
    @Inject('WEB_SOCKET_SERVER') protected server: Server
  ) {
    super('stateMachine', 'state-machine', 'Implements a simple state machine', flowId, componentId, amqpConnection, server);
    this.flowId = flowId;
    this.componentId = componentId;
    this.logger = new CustomLogger(`${flowId}.${componentId}`, this.amqpConnection);
    this.states = new Set();
    this.transitions = new Map();
  }

  async handleEvent(eventId: string, data: any): Promise<void> {
    this.logger.log(`Handling event: ${eventId}`);
    switch (eventId) {
      case "init": {
        await this.init(data);
        break;
      }
      case "initializeMachine": {
        await this.initializeMachine(data);
        break;
      }
      case "transition": {
        await this.transition(data);
        break;
      }
      default: {
        this.logger.warn(`Unknown event: ${eventId}`);
      }
    }
  }

  public async init(data: any): Promise<void> {
    return init(this, data);
  }

  public async initializeMachine(data: any): Promise<void> {
    return initializeMachine(this, data);
  }

  public async transition(data: any): Promise<void> {
    return transition(this, data);
  }

  public getCurrentState(): string {
    return this.currentState;
  }

  public getStates(): Set<string> {
    return this.states;
  }

  public getTransitions(): Map<string, Map<string, string>> {
    return this.transitions;
  }
}