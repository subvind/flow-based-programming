import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';

import { MessageQueueAdapter } from 'src/interfaces/message-queue-adapter.interface';
import { AmqpAdapter } from './backplanes/amqp.backplane';
import { IsmqAdapter } from './backplanes/ismq.backplane';

interface Subscription {
  exchange: string;
  routingKey: string;
  queue: string;
  callback: (msg: any) => Promise<void>;
}

@Injectable()
export class BackplaneService implements OnModuleInit, OnModuleDestroy {
  private adapter: MessageQueueAdapter;
  private readonly logger = new Logger(BackplaneService.name);
  private isConnecting = false;
  private isConnected = false;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private subscriptions: Subscription[] = [];

  constructor() {
    const adapterType = process.env.MESSAGE_QUEUE_ADAPTER || 'ismq';
    this.adapter = adapterType === 'amqp' ? new AmqpAdapter(this.logger) : new IsmqAdapter(this.logger);
  }

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    if (this.isConnecting || this.isConnected) {
      return;
    }

    this.isConnecting = true;
    try {
      await this.adapter.connect();
      this.isConnected = true;
      this.clearReconnectInterval();
      this.logger.log('Successfully connected to message queue');
      await this.resubscribeAll();
    } catch (error) {
      this.handleConnectionError(error);
    } finally {
      this.isConnecting = false;
    }
  }

  private async disconnect() {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.adapter.disconnect();
      this.isConnected = false;
      this.clearReconnectInterval();
    } catch (error) {
      this.logger.error('Error disconnecting from message queue', error);
    }
  }

  async publish(exchange: string, routingKey: string, message: any): Promise<void> {
    await this.ensureConnection();
    try {
      await this.adapter.publish(exchange, routingKey, message);
    } catch (error) {
      this.handlePublishError(error);
    }
  }

  async subscribe(
    exchange: string,
    routingKey: string,
    queue: string,
    callback: (msg: any) => Promise<void>
  ): Promise<void> {
    await this.ensureConnection();
    try {
      await this.adapter.subscribe(exchange, routingKey, queue, callback);
      this.subscriptions.push({ exchange, routingKey, queue, callback });
    } catch (error) {
      this.handleSubscribeError(error);
    }
  }

  private async ensureConnection(): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }
  }

  private startReconnectInterval(): void {
    if (!this.reconnectInterval) {
      this.logger.log('Starting backplane reconnection interval...');
      this.reconnectInterval = setInterval(() => {
        this.logger.log('Attempting to reconnect to backplane...');
        this.connect();
      }, 5000);
    }
  }

  private clearReconnectInterval(): void {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
      this.logger.log('Cleared reconnection interval');
    }
  }

  public async reset(): Promise<void> {
    this.logger.log('Resetting backplane connection...');
    await this.disconnect();
    await this.connect();
  }

  private async resubscribeAll(): Promise<void> {
    this.logger.log('Resubscribing to all previous subscriptions...');
    for (const sub of this.subscriptions) {
      try {
        await this.adapter.subscribe(sub.exchange, sub.routingKey, sub.queue, sub.callback);
        this.logger.log(`Resubscribed to ${sub.exchange} ${sub.routingKey} ${sub.queue}`);
      } catch (error) {
        this.logger.error(`Failed to resubscribe to ${sub.exchange} ${sub.routingKey} ${sub.queue}`, error);
      }
    }
  }

  private handleConnectionError(error: any) {
    this.isConnected = false;
    if (error.code === 'ECONNREFUSED') {
      // this.logger.error(`Failed to connect to message queue: ${error.message}`);
      this.startReconnectInterval();
    } else {
      this.logger.error('Unexpected error while connecting to message queue', error);
    }
  }

  private handlePublishError(error: any) {
    if (error.code === 'ECONNREFUSED') {
      // this.logger.error(`Failed to publish message: ${error.message}`);
      this.isConnected = false;
      this.startReconnectInterval();
    } else {
      this.logger.error('Unexpected error while publishing message', error);
    }
  }

  private handleSubscribeError(error: any) {
    if (error.code === 'ECONNREFUSED') {
      // this.logger.error(`Failed to subscribe: ${error.message}`);
      this.isConnected = false;
      this.startReconnectInterval();
    } else {
      this.logger.error('Unexpected error while subscribing', error);
    }
  }
}