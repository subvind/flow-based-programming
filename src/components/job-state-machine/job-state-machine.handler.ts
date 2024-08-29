import { Injectable, Inject } from '@nestjs/common';
import { ComponentBase } from '../../bases/component.base';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Server } from 'socket.io';
import { CustomLogger } from '../../logger/custom-logger';

import { StateMachine } from 'src/interfaces/state-machine.interface';
import { initializeMachine } from 'src/events/initializeMachine.event';
import { transition } from 'src/events/transition.event';

@Injectable()
export class JobStateMachineComponent extends ComponentBase {
  public logger: CustomLogger;
  public stateMachine: StateMachine;
  
  public ports = {
    inputs: [
      'any.publish.initializeMachine',
      'any.publish.set-start',
      'any.publish.set-pause',
      'any.publish.set-resume',
      'any.publish.set-finish',
      'any.publish.set-reset'
    ],
    outputs: [
      'any.publish.get-start',
      'any.publish.get-pause',
      'any.publish.get-resume',
      'any.publish.get-finish',
      'any.publish.get-reset',
      'any.publish.stateChanged',
      'htmx.display.job-state-machine'
    ]
  }

  constructor(
    @Inject('FLOW_ID') flowId: string,
    @Inject('COMPONENT_ID') componentId: string,
    @Inject(AmqpConnection) amqpConnection: AmqpConnection,
    @Inject('WEB_SOCKET_SERVER') protected server: Server,
  ) {
    super('jobStateMachine', 'job-state-machine', 'Implements a job state machine', flowId, componentId, amqpConnection, server);
    this.flowId = flowId;
    this.componentId = componentId;
    this.logger = new CustomLogger(`${flowId}.${componentId}`, this.amqpConnection);
  }

  async handleEvent(eventId: string, data: any): Promise<void> {
    this.logger.log(`Handling event: ${eventId}`);
    switch (eventId) {
      case "initializeMachine": {
        await this.initializeMachine(data);
        break;
      }
      case "set-start":
      case "set-pause":
      case "set-resume":
      case "set-finish":
      case "set-reset": {
        await this.transition(eventId.substring(4)); // Remove 'set-' prefix
        break;
      }
    }
  }

  public initializeMachine(data): Promise<void> {
    return initializeMachine(this, data);
  }

  public transition(data): Promise<void> {
    return transition(this, data);
  }

  public async updateDisplay(): Promise<void> {
    if (!this.stateMachine) {
      this.logger.error('[display] State machine not initialized');
      return;
    }

    const currentState = this.stateMachine.getCurrentState();
    const states = this.stateMachine.getStates();
    const transitions = this.stateMachine.getTransitions();

    await this.display(this.flowId, this.componentId, 'job-state-machine', {
      currentState,
      states: Array.from(states),
      transitions: Object.fromEntries(transitions)
    });
  }
}