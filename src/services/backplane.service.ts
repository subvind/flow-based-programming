import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';

import { MessageQueueAdapter } from 'src/interfaces/message-queue-adapter.interface';
import { AmqpAdapter } from './backplanes/amqp.backplane';
import { IsmqAdapter } from './backplanes/ismq.backplane';

@Injectable()
export class BackplaneService implements OnModuleInit, OnModuleDestroy {
  private adapter: MessageQueueAdapter;
  private readonly logger = new Logger(BackplaneService.name);
  private isInitialized = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000; // 5 seconds

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
    try {
      await this.adapter.connect();
      this.isInitialized = true;
      this.reconnectAttempts = 0;
    } catch (error) {
      this.logger.error('Failed to connect to message queue', error);
      this.isInitialized = false;
      await this.scheduleReconnect();
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
    await this.ensureConnection();
    try {
      await this.adapter.publish(exchange, routingKey, message);
    } catch (error) {
      this.logger.error('Failed to publish message, attempting to reconnect...', error);
      await this.scheduleReconnect();
      throw error;
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
    } catch (error) {
      this.logger.error('Failed to subscribe, attempting to reconnect...', error);
      await this.scheduleReconnect();
      throw error;
    }
  }

  private async ensureConnection(): Promise<void> {
    if (!this.isInitialized) {
      this.logger.warn('Connection not initialized, attempting to reconnect...');
      await this.connect();
    }
  }

  private async scheduleReconnect(): Promise<void> {
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
    await this.connect();
  }
}