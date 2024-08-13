import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ComponentRegistry } from './component-registry.service';
import { Flow } from '../interfaces/flow.interface';

@Injectable()
export class FlowExecutorService {
  @Inject('FLOW_SERVICE')
  private client: ClientProxy;
  private readonly logger = new Logger(FlowExecutorService.name);

  constructor(private componentRegistry: ComponentRegistry) {
    this.client = ClientProxyFactory.create({
      transport: Transport.REDIS,
      options: {
        url: 'redis://localhost:6379',
      },
    });

    this.client.connect().then(() => {
      this.logger.log('Connected to Redis successfully');
    }).catch(err => {
      this.logger.error('Failed to connect to Redis', err);
    });
  }

  async executeFlow(flow: Flow) {
    this.logger.log(`Executing flow: ${flow.id}`);
    for (const connection of flow.connections) {
      this.logger.log(`Creating connection: ${connection.fromComponent}.${connection.fromEvent} -> ${connection.toComponent}.${connection.toEvent}`);
      await this.client.emit('createConnection', connection).toPromise();
    }

    for (const component of flow.components) {
      const componentInstance = this.componentRegistry.getComponent(component.componentId);
      if (componentInstance) {
        this.logger.log(`Starting component: ${component.componentId}`);
        await this.client.emit('componentEvent', {
          componentId: component.componentId,
          eventName: 'start',
          data: null,
        }).toPromise();
      } else {
        this.logger.warn(`Component not found: ${component.componentId}`);
      }
    }
  }
}