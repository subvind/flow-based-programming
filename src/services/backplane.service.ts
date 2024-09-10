import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class BackplaneService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private connectionPromise: Promise<void> | null = null;
  private readonly logger = new Logger(BackplaneService.name);
  private isInitialized = false;

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise<void>(async (resolve, reject) => {
      try {
        this.logger.log('Connecting to RabbitMQ...');
        this.connection = await amqp.connect('amqp://localhost:5672');
        this.channel = await this.connection.createChannel();
        this.logger.log('Successfully connected to RabbitMQ');
        this.isInitialized = true;
        resolve();
      } catch (error) {
        this.logger.error('Failed to connect to RabbitMQ', error);
        this.isInitialized = false;
        this.connection = null;
        this.channel = null;
        reject(error);
      } finally {
        this.connectionPromise = null;
      }
    });

    return this.connectionPromise;
  }

  private async disconnect() {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      this.isInitialized = false;
      this.logger.log('Disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ', error);
    }
  }

  async publish(exchange: string, routingKey: string, message: any): Promise<void> {
    await this.ensureConnection();
    if (!this.channel) {
      throw new Error('Channel is not available');
    }
    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    this.channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)));
  }

  async subscribe(
    exchange: string,
    routingKey: string,
    queue: string,
    callback: (msg: any) => Promise<void>
  ): Promise<void> {
    await this.ensureConnection();
    if (!this.channel) {
      throw new Error('Channel is not available');
    }
    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    const q = await this.channel.assertQueue(queue, { exclusive: false, durable: true });
    await this.channel.bindQueue(q.queue, exchange, routingKey);
    
    this.channel.consume(q.queue, async (msg) => {
      if (msg !== null) {
        const content = JSON.parse(msg.content.toString());
        await callback(content);
        this.channel.ack(msg);
      }
    });
  }

  private async ensureConnection(): Promise<void> {
    if (!this.isInitialized || !this.connection || !this.channel) {
      this.logger.warn('Connection not initialized or lost, attempting to reconnect...');
      await this.connect();
    }
    
    if (!this.channel || this.channel.closed) {
      this.logger.warn('Channel not initialized or closed, attempting to create a new channel...');
      try {
        if (!this.connection) {
          throw new Error('Connection is not available');
        }
        this.channel = await this.connection.createChannel();
      } catch (error) {
        this.logger.error('Failed to create a new channel', error);
        throw new Error('Failed to initialize channel');
      }
    }
  }
}