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
  private isInitialized = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000; // 5 seconds
  private isReconnecting = false;
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
    if (this.isReconnecting) {
      this.logger.log('Reconnection already in progress, skipping new attempt');
      return;
    }

    this.isReconnecting = true;
    try {
      await this.adapter.connect();
      this.isInitialized = true;
      this.reconnectAttempts = 0;
      this.isReconnecting = false;
      await this.resubscribeAll();
    } catch (error) {
      this.handleConnectionError(error);
    }
  }

  private async disconnect() {
    try {
      await this.adapter.disconnect();
      this.isInitialized = false;
    } catch (error) {
      this.logger.error('Error disconnecting from message queue', error);
    }
  }

  async publish(exchange: string, routingKey: string, message: any): Promise<void> {
    try {
      await this.ensureConnection();
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
    try {
      await this.ensureConnection();
      await this.adapter.subscribe(exchange, routingKey, queue, callback);
      this.subscriptions.push({ exchange, routingKey, queue, callback });
    } catch (error) {
      this.handleSubscribeError(error);
    }
  }

  private async ensureConnection(): Promise<void> {
    if (!this.isInitialized && !this.isReconnecting) {
      this.logger.warn('Connection not initialized, attempting to reconnect...');
      await this.connect();
    }
  }

  private async scheduleReconnect(): Promise<void> {
    if (this.isReconnecting) {
      this.logger.log('Reconnection already scheduled, skipping new attempt');
      return;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.logger.log(`Scheduling reconnection attempt ${this.reconnectAttempts} of ${this.maxReconnectAttempts}...`);
      setTimeout(() => this.connect(), this.reconnectInterval);
    } else {
      this.logger.error('Max reconnection attempts reached. Please check the MQ server and restart the application.');
    }
  }

  public async reset(): Promise<void> {
    this.logger.log('Resetting backplane connection...');
    await this.disconnect();
    this.reconnectAttempts = 0;
    this.isReconnecting = false;
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
    this.isInitialized = false;
    this.isReconnecting = false;
    if (error.code === 'ECONNREFUSED') {
      this.logger.error(`Failed to connect to message queue: ${error.message}`);
      this.scheduleReconnect();
    } else {
      this.logger.error('Unexpected error while connecting to message queue', error);
    }
  }

  private handlePublishError(error: any) {
    if (error.code === 'ECONNREFUSED') {
      this.logger.error(`Failed to publish message: ${error.message}`);
      this.scheduleReconnect();
    } else {
      this.logger.error('Unexpected error while publishing message', error);
    }
  }

  private handleSubscribeError(error: any) {
    if (error.code === 'ECONNREFUSED') {
      this.logger.error(`Failed to subscribe: ${error.message}`);
      this.scheduleReconnect();
    } else {
      this.logger.error('Unexpected error while subscribing', error);
    }
  }
}