import { CustomLogger } from '../../logger/custom-logger';
import { Injectable, Inject } from '@nestjs/common';
import { ComponentBase } from '../../bases/component.base';
import { BackplaneService } from 'src/services/backplane.service';
import { Server } from 'socket.io';
import { TemplateCacheService } from 'src/services/template-cache.service';

@Injectable()
export class BenchmarkAnalyzerComponent extends ComponentBase {
  public logger: CustomLogger;
  private startTime: number | null = null;
  private endTime: number | null = null;
  private dataPoints: { [size: number]: number[] } = {};
  private currentMessageSize: number = 1;
  private messageSizes: number[] = [1, 10, 100, 1000, 10000];
  private messagesPerSize: number = 1000;
  private currentSizeIndex: number = 0;
  public ports = {
    inputs: [
      'any.publish.startBenchmark',
      'any.publish.endBenchmark',
      'any.publish.dataPoint',
      'any.publish.setMessageSize'
    ],
    outputs: [
      'any.publish.benchmarkResult',
      'htmx.display.benchmark-results',
      'any.publish.startMessageGeneration',
      'any.publish.stopMessageGeneration',
      'any.publish.nextMessageSize'
    ]
  }

  constructor(
    @Inject('FLOW_ID') flowId: string,
    @Inject('COMPONENT_ID') componentId: string,
    @Inject(BackplaneService) backplane: BackplaneService,
    @Inject('WEB_SOCKET_SERVER') protected server: Server,
    @Inject('TEMPLATES') templates: TemplateCacheService
  ) {
    super('benchmarkAnalyzer', 'benchmark-analyzer', 'Analyzes benchmark results', flowId, componentId, backplane, server, templates);
    this.flowId = flowId;
    this.componentId = componentId;
    this.logger = new CustomLogger(`${flowId}.${componentId}`);
  }

  async handleEvent(eventId: string, data: any): Promise<void> {
    this.logger.log(`BenchmarkAnalyzer (${this.flowId}) handling event: ${eventId}`);
    switch (eventId) {
      case "init": {
        await this.initBenchmark(data);
        break;
      }
      case "startBenchmark": {
        this.startBenchmark();
        break;
      }
      case "endBenchmark": {
        await this.endBenchmark();
        break;
      }
      case "dataPoint": {
        await this.addDataPoint(data.processingTime, data.size);
        break;
      }
      case "setMessageSize": {
        this.setMessageSize(data.size);
        break;
      }
    }
  }

  private async initBenchmark(data: any): Promise<void> {
    if (data && data.messageSizes) {
      this.messageSizes = data.messageSizes;
    }
    if (data && data.messagesPerSize) {
      this.messagesPerSize = data.messagesPerSize;
    }
    this.logger.log(`Benchmark initialized with message sizes: ${this.messageSizes}, messages per size: ${this.messagesPerSize}`);
  }
  
  private async startBenchmark(): Promise<void> {
    this.startTime = Date.now();
    this.dataPoints[this.currentMessageSize] = [];
    this.logger.log(`Benchmark started for size ${this.currentMessageSize} at ${this.startTime}`);
    
    // Send start signal to message generator
    await this.publish(this.flowId, this.componentId, 'startMessageGeneration', {});
  }

  private async endBenchmark(): Promise<void> {
    this.endTime = Date.now();
    this.logger.log(`Benchmark ended for size ${this.currentMessageSize} at ${this.endTime}`);

    // Send stop signal to message generator
    await this.publish(this.flowId, this.componentId, 'stopMessageGeneration', {});

    if (this.currentSizeIndex < this.messageSizes.length - 1) {
      this.currentSizeIndex++;
      await this.startNextSizeBenchmark();
    } else {
      const result = this.analyzeBenchmark();
      await this.publish(this.flowId, this.componentId, 'benchmarkResult', result);
      
      // Display the results using HTMX
      await this.display(this.flowId, this.componentId, 'benchmark-results', result);
    }
  }

  private async addDataPoint(processingTime: number, size: number): Promise<void> {
    this.dataPoints[size].push(processingTime);
    if (this.dataPoints[size].length >= this.messagesPerSize) {
      await this.endBenchmark();
    }
  }

  private setMessageSize(size: number): void {
    this.currentMessageSize = size;
  }

  private async startNextSizeBenchmark(): Promise<void> {
    this.currentMessageSize = this.messageSizes[this.currentSizeIndex];
    await this.publish(this.flowId, this.componentId, 'nextMessageSize', { size: this.currentMessageSize });
    // this.startBenchmark();
  }

  private analyzeBenchmark(): any {
    const results: BenchmarkResults = {};

    for (const [size, times] of Object.entries(this.dataPoints)) {
      const messageCount = times.length;
      const totalTime = times.reduce((sum, time) => sum + time, 0);
      const averageProcessingTime = totalTime / messageCount;
      const messagesPerSecond = (messageCount / (totalTime / 1000)).toFixed(2);

      results[size] = {
        messageCount,
        averageProcessingTime,
        messagesPerSecond,
        formattedResult: `Message Size: ${size} bytes, Throughput: ${messagesPerSecond} messages/second`
      };
    }

    return {
      results,
      formattedResults: Object.values(results).map(r => r.formattedResult).join('\n')
    };
  }
}

interface BenchmarkResult {
  messageCount: number;
  averageProcessingTime: number;
  messagesPerSecond: string;
  formattedResult: string;
}

interface BenchmarkResults {
  [size: string]: BenchmarkResult;
}