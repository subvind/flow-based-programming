import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { Component } from '../interfaces/component.interface';

@Injectable()
export abstract class ComponentService implements Component {
  @Inject('FLOW_SERVICE')
  protected client: ClientProxy;
  public readonly logger = new Logger(ComponentService.name);

  constructor(
    public id: string,
    public name: string,
    public description: string
  ) {
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

  abstract handleEvent(eventName: string, data: any): Promise<void>;

  async emitEvent(eventName: string, data: any): Promise<void> {
    this.logger.log(`Emitting event: ${eventName}, data: ${JSON.stringify(data)}`);
    await this.client.emit('componentEvent', {
      componentId: this.id,
      eventName,
      data,
    }).toPromise();
  }
}