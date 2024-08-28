import { CustomLogger } from '../../logger/custom-logger';
import { Injectable, Inject } from '@nestjs/common';
import { ComponentBase } from '../../bases/component.base';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Server } from 'socket.io';

import { initializeMachine } from './initialize-machine.event';
import { transition } from './transition.event';

@Injectable()
export class StateMachineComponent extends ComponentBase {
  public logger;
  public currentState: string;
  public states: Set<string>;
  public transitions: Map<string, Map<string, string>>;
  
  public ports = { // io format: <dataType>.<dataMethod>.<eventId>
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
    this.logger.log(`StateMachine (${this.flowId}) handling event: ${eventId}`);
    switch (eventId) {
      case "initializeMachine": {
        this.logger.log(`StateMachine (${this.flowId}) initializing machine`);
        await this.initializeMachine(data);
        break;
      }
      case "transition": {
        this.logger.log(`StateMachine (${this.flowId}) transitioning`);
        await this.transition(data);
        break;
      }
    }
  }

  private async initializeMachine(data): Promise<void> {
    return initializeMachine(this, data);
  }

  private async transition(data): Promise<void> {
    return transition(this, data);
  }
}