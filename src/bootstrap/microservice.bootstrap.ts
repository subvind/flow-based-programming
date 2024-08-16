import { NestFactory } from '@nestjs/core';
import { AppModule } from '../modules/app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { CustomLogger } from '../logger/custom-logger';

export async function bootstrapMicroservice(logger: CustomLogger): Promise<any> {
  const microservice = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.TCP,
    options: {
      host: 'localhost',
      port: 3001,
    },
    logger,
  });

  await microservice.listen();
  logger.log('Microservice is now listening for TCP events on port 3001');

  return microservice;
}