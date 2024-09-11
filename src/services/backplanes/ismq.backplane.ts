import { Logger } from '@nestjs/common';
import { MessageQueueClient } from 'message-queue/client';

import { MessageQueueAdapter } from 'src/interfaces/message-queue-adapter.interface';

export class IsmqAdapter implements MessageQueueAdapter {
  private client: MessageQueueClient | null = null;

  constructor(private readonly logger: Logger) {}

  async connect(): Promise<void> {
    this.logger.log('Connecting to ISMQ...');
    this.client = new MessageQueueClient('http://localhost:3030', {
      verbose: false
    });
    try {
      await this.client.connectWebSocket();
      this.logger.log('Successfully connected to ISMQ');
    } catch (error) {
      this.logger.error(`Failed to connect to ISMQ: ${error.message}`);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        this.client.disconnectWebSocket();
        this.client = null;
        this.logger.log('Disconnected from ISMQ');
      } catch (error) {
        this.logger.error(`Error disconnecting from ISMQ: ${error.message}`);
      }
    }
  }

  async publish(exchange: string, routingKey: string, message: any): Promise<void> {
    if (!this.client) {
      throw new Error('ISMQ is not available');
    }
    try {
      await this.client.createExchange(exchange);
      await this.client.publish(exchange, routingKey, message);
    } catch (error) {
      this.logger.error(`Failed to publish message: ${error.message}`);
      throw error;
    }
  }

  async subscribe(
    exchange: string,
    routingKey: string,
    queue: string,
    callback: (msg: any) => Promise<void>
  ): Promise<void> {
    if (!this.client) {
      throw new Error('ISMQ is not available');
    }
    this.logger.log(`Subscribing to exchange: ${exchange}, routingKey: ${routingKey}, queue: ${queue}`);
    try {
      await this.client.createExchange(exchange);
      await this.client.bind(exchange, queue, routingKey);
      
      await this.client.subscribeToQueue(exchange, queue, async (message) => {
        try {
          await callback(message);
        } catch (error) {
          this.logger.error(`Error processing message from queue ${queue}: ${error.message}`);
        }
      });
    } catch (error) {
      this.logger.error(`Failed to subscribe to queue ${queue}: ${error.message}`);
      throw error;
    }
  }
}