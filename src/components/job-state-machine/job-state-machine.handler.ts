import { Injectable, Inject } from '@nestjs/common';
import { ComponentBase } from '../../bases/component.base';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Server } from 'socket.io';
import { CustomLogger } from '../../logger/custom-logger';

import { StateMachineComponent } from '../state-machine/state-machine.handler';

@Injectable()
export class JobStateMachineComponent extends ComponentBase {
  public logger: CustomLogger;
  private stateMachine: StateMachineComponent;
  
  public ports = {
    inputs: [
      'any.publish.initializeMachine',
      'any.publish.start',
      'any.publish.pause',
      'any.publish.resume',
      'any.publish.finish',
      'any.publish.reset'
    ],
    outputs: [
      'any.publish.initializeMachine',
      'any.publish.start',
      'any.publish.pause',
      'any.publish.resume',
      'any.publish.finish',
      'any.publish.reset',
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
      case "start":
      case "pause":
      case "resume":
      case "finish":
      case "reset": {
        await this.transition(eventId);
        break;
      }
    }
  }

  private async initializeMachine(data: any): Promise<void> {
    this.getPorts();
    this._ports.inputs.forEach((input) => {
      input.connections.forEach(async (connection) => {
        let smComponent: any = connection.connectedFrom;

        await smComponent.initializeMachine(data);
        await this.updateDisplay(smComponent);

        let currentState = await smComponent.getCurrentState()
        await this.publish(this.flowId, this.componentId, 'initializeMachine', { 
          currentState
        });
      })
    })
  }

  private async transition(event: string): Promise<void> {
    let previousState;
    let currentState;
    this.getPorts();
    this._ports.inputs.forEach((input) => {
      input.connections.forEach(async (connection) => {
        let smComponent: any = connection.connectedFrom;
        previousState = await smComponent.getCurrentState();
        await this.stateMachine.transition({ event });
        currentState = await smComponent.getCurrentState();

        await this.updateDisplay(smComponent);
      })
    });
    

    // Publish to the specific event port
    await this.publish(this.flowId, this.componentId, event, { 
      previousState,
      currentState
    });

    // Also publish to the general stateChanged port
    await this.publish(this.flowId, this.componentId, 'stateChanged', { 
      previousState,
      currentState,
      event
    });
  }

  private async updateDisplay(stateMachineComponent): Promise<void> {
    let currentState = await stateMachineComponent.getCurrentState();
    let states = await stateMachineComponent.getStates();
    let transitions = await stateMachineComponent.getTransitions();

    await this.display(this.flowId, this.componentId, 'job-state-machine', {
      currentState,
      states: Array.from(states),
      transitions: Object.fromEntries(transitions)
    });
  }
}