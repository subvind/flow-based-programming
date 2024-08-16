import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ComponentRegistry } from './component-registry.service';
import { Flow } from '../interfaces/flow.interface';

@Injectable()
export class FlowExecutorService {
  private readonly logger = new Logger(FlowExecutorService.name);

  constructor(
    @Inject('FLOW_SERVICE') private client: ClientProxy,
    private componentRegistry: ComponentRegistry
  ) {}

  async executeFlow(flow: Flow) {
    this.logger.log(`Executing flow: ${flow.id}`);

    // Create connections
    for (const connection of flow.connections) {
      this.logger.log(`Creating connection: ${connection.fromComponent}.${connection.fromEvent} -> ${connection.toComponent}.${connection.toEvent}`);
      await this.client.emit('createConnection', connection).toPromise();
    }

    // Start components
    for (const component of flow.components) {
      const componentInstance = this.componentRegistry.getComponent(component.componentId);
      if (componentInstance) {
        this.logger.log(`Starting component: ${component.componentId}`);
        try {
          await this.client.emit('componentEvent', {
            componentId: component.componentId,
            eventName: 'start',
            data: null,
          }).toPromise();
        } catch (error) {
          this.logger.error(`Error starting component ${component.componentId}:`, error);
        }
      } else {
        this.logger.warn(`Component not found: ${component.componentId}`);
      }
    }
  }
}