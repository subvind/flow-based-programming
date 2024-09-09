import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class BackplaneService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private connectionPromise: Promise<void>;
  private readonly logger = new Logger(BackplaneService.name);

  async onModuleInit() {
    this.connectionPromise = this.connect();
    await this.connectionPromise;
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    try {
      this.logger.log('Connecting to RabbitMQ...');
      this.connection = await amqp.connect('amqp://localhost:5672');
      this.channel = await this.connection.createChannel();
      this.logger.log('Successfully connected to RabbitMQ');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
      throw error;
    }
  }

  private async disconnect() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.logger.log('Disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ', error);
    }
  }

  async publish(exchange: string, routingKey: string, message: any): Promise<void> {
    await this.ensureConnection();
    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    this.channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)));
  }

  async subscribe(exchange: string, routingKey: string, queue: string, callback: (msg: any) => Promise<void>): Promise<void> {
    await this.ensureConnection();
    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    const q = await this.channel.assertQueue(queue, { exclusive: true });
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
    if (!this.channel) {
      this.logger.warn('Channel not initialized, attempting to reconnect...');
      await this.connectionPromise;
      if (!this.channel) {
        throw new Error('Failed to initialize channel');
      }
    }
  }
}