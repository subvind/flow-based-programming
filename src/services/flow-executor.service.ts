import { Injectable, Logger } from '@nestjs/common';
import { ComponentRegistry } from './component-registry.service';
import { Flow } from '../interfaces/flow.interface';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { initializeComponent } from '../initializers/component.initialize';
import { Component } from 'src/interfaces/component.interface';
import { TemplateCacheService } from './template-cache.service';
import { BackplaneService } from './backplane.service';

@WebSocketGateway()
@Injectable()
export class FlowExecutorService {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(FlowExecutorService.name);
  private flows: Flow[] = [];
  
  constructor(
    private backplaneService: BackplaneService,
    private componentRegistry: ComponentRegistry,
    private templateCacheService: TemplateCacheService
  ) {}

  async getFlows(): Promise<Flow[]> {
    return this.flows;
  }

  async getFlow(flowId: string): Promise<Flow | undefined> {
    return this.flows.find(flow => flow.id === flowId);
  }

  async executeFlow(flow: Flow) {
    this.logger.log(`Executing flow: ${flow.id}`);

    // Remove old flow and add new flow
    var filteredFlows = this.flows.filter(function(f: Flow) { 
      return f.id != flow.id; 
    });
    this.flows = filteredFlows;
    this.flows.push(flow);

    // Create connections
    for (const connection of flow.connections) {
      this.logger.log(`Creating connection: ${connection.fromComponent}.${connection.fromEvent} -> ${connection.toComponent}.${connection.toEvent}`);
      await this.backplaneService.publish('flow_exchange', 'createConnection', { ...connection, flowId: flow.id });
    }

    // Construct components
    let instances = [];
    for (const component of flow.components) {
      this.logger.log(`Constructing component: ${component.componentId} (${component.componentRef}) for flow: ${flow.id}`);
      
      // initialize a new component instance
      let componentInstance: Component = initializeComponent(flow, component, this.backplaneService, this.server, this.templateCacheService);

      // register new instance with component registery
      this.componentRegistry.registerComponent(componentInstance);
      instances.push(componentInstance);
    }

    // Sync connections for component
    for (const instance of instances) {
      this.logger.log(`Sync connections for component: ${instance.componentId} (${instance.componentRef}) for flow: ${instance.flowId}`);
      instance.syncConnections(flow.connections, this.componentRegistry);
    }
    
    // Init component
    for (const component of flow.components) {
      this.logger.log(`Initializing component: ${component.componentId} (${component.componentRef}) for flow: ${flow.id}`);

      try {
        await this.backplaneService.publish('flow_exchange', 'componentEvent', {
          flowId: flow.id,
          componentId: component.componentId,
          componentRef: component.componentRef,
          eventId: 'init',
          data: component.init,
        });
      } catch (error) {
        this.logger.error(`Error initializing component ${component.componentId} for flow ${flow.id}:`, error);
      }
    }
  }
}