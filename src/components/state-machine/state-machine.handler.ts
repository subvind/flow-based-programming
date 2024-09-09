import { CustomLogger } from '../../logger/custom-logger';
import { Injectable, Inject } from '@nestjs/common';
import { ComponentBase } from '../../bases/component.base';
import { BackplaneService } from 'src/services/backplane.service';
import { Server } from 'socket.io';
import { TemplateCacheService } from 'src/services/template-cache.service';

import { init } from './init.event';
import { initStateMachine } from './initStateMachine.event';
import { transition } from './transition.event';

@Injectable()
export class StateMachineComponent extends ComponentBase {
  public logger: CustomLogger;
  public currentState: string;
  public states: Set<string>;
  public transitions: Map<string, Map<string, string>>;
  
  public ports = {
    inputs: [
      'any.publish.initStateMachine',
      'any.publish.transition'
    ],
    outputs: [
      'any.publish.initProxyMachine',
      'any.publish.stateChanged',
      'htmx.display.state-machine'
    ]
  }

  constructor(
    @Inject('FLOW_ID') flowId: string,
    @Inject('COMPONENT_ID') componentId: string,
    @Inject(BackplaneService) backplane: BackplaneService,
    @Inject('WEB_SOCKET_SERVER') protected server: Server,
    @Inject('TEMPLATES') templates: TemplateCacheService
  ) {
    super('stateMachine', 'state-machine', 'Implements a simple state machine', flowId, componentId, backplane, server, templates);
    this.flowId = flowId;
    this.componentId = componentId;
    this.logger = new CustomLogger(`${flowId}.${componentId}`);
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
      case "initStateMachine": {
        await this.initStateMachine(data);
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

  public async initStateMachine(data: any): Promise<void> {
    return initStateMachine(this, data);
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