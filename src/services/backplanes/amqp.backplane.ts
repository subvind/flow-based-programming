import { Logger } from '@nestjs/common';
import * as amqp from 'amqplib';

import { MessageQueueAdapter } from 'src/interfaces/message-queue-adapter.interface';

export class AmqpAdapter implements MessageQueueAdapter {
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