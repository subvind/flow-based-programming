import { Injectable, Inject } from '@nestjs/common';
import { ComponentBase } from '../../bases/component.base';
import { BackplaneService } from 'src/services/backplane.service';
import { Server } from 'socket.io';
import { CustomLogger } from '../../logger/custom-logger';
import { TemplateCacheService } from 'src/services/template-cache.service';

import { StateMachine } from 'src/interfaces/state-machine.interface';
import { initProxyMachine } from 'src/events/initProxyMachine.event';
import { transition } from 'src/events/transition.event';

@Injectable()
export class JobStateMachineComponent extends ComponentBase {
  public logger: CustomLogger;
  public stateMachine: StateMachine;
  private messageSizes: number[] = [1, 10, 100, 1000, 10000];
  private currentSizeIndex: number = 0;
  
  public ports = {
    inputs: [
      'any.publish.initProxyMachine',
      'any.publish.set-start',
      'any.publish.set-pause',
      'any.publish.set-resume',
      'any.publish.set-finish',
      'any.publish.set-reset',
      'any.publish.set-next'
    ],
    outputs: [
      'any.publish.get-start',
      'any.publish.get-pause',
      'any.publish.get-resume',
      'any.publish.get-finish',
      'any.publish.get-reset',
      'any.publish.get-next',
      'any.publish.stateChanged',
      'htmx.display.job-state-machine'
    ]
  }

  constructor(
    @Inject('FLOW_ID') flowId: string,
    @Inject('COMPONENT_ID') componentId: string,
    @Inject(BackplaneService) backplane: BackplaneService,
    @Inject('WEB_SOCKET_SERVER') protected server: Server,
    @Inject('TEMPLATES') templates: TemplateCacheService
  ) {
    super('jobStateMachine', 'job-state-machine', 'Implements a job state machine', flowId, componentId, backplane, server, templates);
    this.flowId = flowId;
    this.componentId = componentId;
    this.logger = new CustomLogger(`${flowId}.${componentId}`);
  }

  async handleEvent(eventId: string, data: any): Promise<void> {
    this.logger.log(`Handling event: ${eventId}`);
    switch (eventId) {
      case "initProxyMachine": {
        await this.initProxyMachine(data);
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
      case "set-next": {
        await this.nextMessageSize();
        break;
      }
    }
  }

  public initProxyMachine(data): Promise<void> {
    return initProxyMachine(this, data);
  }

  public transition(data): Promise<void> {
    return transition(this, data);
  }

  private async nextMessageSize(): Promise<void> {
    if (this.currentSizeIndex < this.messageSizes.length - 1) {
      this.currentSizeIndex++;
      const newSize = this.messageSizes[this.currentSizeIndex];
      await this.publish(this.flowId, this.componentId, 'get-next', { size: newSize });
      await this.transition('start');
    } else {
      await this.transition('finish');
    }
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
      transitions: Object.fromEntries(transitions),
      currentMessageSize: this.messageSizes[this.currentSizeIndex]
    });
  }
}