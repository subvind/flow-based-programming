import { NestFactory } from '@nestjs/core';
import { AppModule } from '../modules/app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { CustomLogger } from '../logger/custom-logger';

export async function bootstrapMicroservice(logger: CustomLogger): Promise<any> {
  try {
    const microservice = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://localhost:5672'], // Replace with your RabbitMQ server URL
        queue: 'flow_queue', // Replace with your desired queue name
        queueOptions: {
          durable: false
        },
      },
      logger,
    });

    await microservice.listen();
    logger.log('Microservice is now listening for RabbitMQ events');

    return microservice;
  } catch (error) {
    logger.error(`Failed to start microservice: ${error.message}`, error.stack);
    throw error;
  }
}