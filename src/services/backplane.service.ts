import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';
import { MessageQueueClient } from 'message-queue/client';

interface MessageQueueAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  publish(exchange: string, routingKey: string, message: any): Promise<void>;
  subscribe(exchange: string, routingKey: string, queue: string, callback: (msg: any) => Promise<void>): Promise<void>;
}

class AmqpAdapter implements MessageQueueAdapter {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;

  constructor(private readonly logger: Logger) {}

  async connect(): Promise<void> {
    this.logger.log('Connecting to RabbitMQ...');
    this.connection = await amqp.connect('amqp://localhost:5672');
    this.channel = await this.connection.createChannel();
    this.logger.log('Successfully connected to RabbitMQ');
  }

  async disconnect(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
      this.channel = null;
    }
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
    this.logger.log('Disconnected from RabbitMQ');
  }

  async publish(exchange: string, routingKey: string, message: any): Promise<void> {
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
}

class IsmqAdapter implements MessageQueueAdapter {
  private client: MessageQueueClient | null = null;

  constructor(private readonly logger: Logger) {}

  async connect(): Promise<void> {
    this.logger.log('Connecting to ISMQ...');
    this.client = new MessageQueueClient('http://localhost:3030');
    await this.client.connectWebSocket();
    this.logger.log('Successfully connected to ISMQ');
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      this.client.disconnectWebSocket();
      this.client = null;
    }
    this.logger.log('Disconnected from ISMQ');
  }

  async publish(exchange: string, routingKey: string, message: any): Promise<void> {
    if (!this.client) {
      throw new Error('ISMQ is not available');
    }
    this.logger.log(`Publishing message to exchange: ${exchange}, routingKey: ${routingKey}`);
    await this.client.createExchange(exchange);
    await this.client.publish(exchange, routingKey, message);
    this.logger.log('Message published successfully');
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
    await this.client.createExchange(exchange);
    await this.client.bind(exchange, queue, routingKey);
    let subscription = await this.client.subscribeToQueue(exchange, queue, async (message) => {
      this.logger.log(`Received message on queue: ${queue}, content: ${JSON.stringify(message)}`);
      try {
        await callback(message);
        this.logger.log(`Successfully processed message from queue: ${queue}`);
      } catch (error) {
        this.logger.error(`Error processing message from queue ${queue}: ${error.message}`);
      }
    });
    this.logger.log(`Successfully subscribed to queue: ${queue}`);
  }
}

@Injectable()
export class BackplaneService implements OnModuleInit, OnModuleDestroy {
  private adapter: MessageQueueAdapter;
  private readonly logger = new Logger(BackplaneService.name);
  private isInitialized = false;

  constructor() {
    // You can switch between 'amqp' and 'ismq' here or use an environment variable
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
    } catch (error) {
      this.logger.error('Failed to connect to message queue', error);
      this.isInitialized = false;
      throw error;
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
    await this.adapter.publish(exchange, routingKey, message);
  }

  async subscribe(
    exchange: string,
    routingKey: string,
    queue: string,
    callback: (msg: any) => Promise<void>
  ): Promise<void> {
    await this.ensureConnection();
    await this.adapter.subscribe(exchange, routingKey, queue, callback);
  }

  private async ensureConnection(): Promise<void> {
    if (!this.isInitialized) {
      this.logger.warn('Connection not initialized, attempting to reconnect...');
      await this.connect();
    }
  }
}