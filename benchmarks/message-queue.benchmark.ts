import { MessageQueueAdapter } from '../src/interfaces/message-queue-adapter.interface';
import { AmqpAdapter } from '../src/services/backplanes/amqp.backplane';
import { IsmqAdapter } from '../src/services/backplanes/ismq.backplane';
import { Logger } from '@nestjs/common';
import * as Benchmark from 'benchmark';

const logger = new Logger('MessageQueueBenchmark');

// Create instances of the adapters
const amqpAdapter = new AmqpAdapter(logger);
const ismqAdapter = new IsmqAdapter(logger);

function generateMessage(size: number): string {
  return 'x'.repeat(size);
}

async function runBenchmark(adapter: MessageQueueAdapter, messageSize: number, numMessages: number) {
  const exchange = 'benchmark_exchange';
  const routingKey = 'benchmark_key';
  const queue = 'benchmark_queue';

  logger.log(`Starting benchmark for ${adapter.constructor.name} with message size ${messageSize} bytes and ${numMessages} messages`);

  try {
    await adapter.connect();
    logger.log(`Connected to ${adapter.constructor.name}`);

    return new Promise<void>((resolve, reject) => {
      const message = generateMessage(messageSize);
      let received = 0;
      let published = 0;
      const startTime = Date.now();

      adapter.subscribe(exchange, routingKey, queue, async () => {
        received++;
        if (received === numMessages) {
          const endTime = Date.now();
          const duration = endTime - startTime;
          logger.log(`Received all ${numMessages} messages in ${duration}ms`);
          await adapter.disconnect();
          resolve();
        }
      }).catch(reject);

      const publishInterval = setInterval(async () => {
        if (published < numMessages) {
          try {
            await adapter.publish(exchange, routingKey, message);
            published++;
            if (published % 10 === 0) {
              logger.debug(`Published ${published} messages`);
            }
          } catch (error) {
            clearInterval(publishInterval);
            reject(error);
          }
        } else {
          clearInterval(publishInterval);
          logger.log(`Finished publishing ${numMessages} messages`);
        }
      }, 10); // Publish a message every 10ms to avoid overwhelming the queue
    });
  } catch (error) {
    logger.error(`Error in benchmark for ${adapter.constructor.name}: ${error.message}`);
    throw error;
  }
}

async function runAllBenchmarks() {
  const messageSizes = [10, 100, 1000];
  const numMessages = 100;

  logger.log('Starting all benchmarks');

  for (const adapter of [amqpAdapter, ismqAdapter]) {
    for (const size of messageSizes) {
      try {
        await runBenchmark(adapter, size, numMessages);
      } catch (error) {
        logger.error(`Failed to run benchmark for ${adapter.constructor.name} with size ${size}: ${error.message}`);
      }
    }
  }

  logger.log('All benchmarks completed');
}

runAllBenchmarks().catch((error) => {
  logger.error('Benchmark error:', error);
  process.exit(1);
});