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
  private messagesPerSize: number = 500;
  private currentSizeIndex: number = 0;
  public ports = {
    inputs: [
      'any.publish.startBenchmark',
      'any.publish.endBenchmark',
      'any.publish.dataPoint'
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
    // this.logger.log(`BenchmarkAnalyzer (${this.flowId}) handling event: ${eventId}`);
    switch (eventId) {
      case "init": {
        await this.initBenchmark(data);
        break;
      }
      case "startBenchmark": {
        await this.startBenchmark();
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
    this.resetDataPoints();
  }
  
  private async startBenchmark(): Promise<void> {
    this.startTime = Date.now();
    this.currentSizeIndex = 0;
    this.currentMessageSize = this.messageSizes[this.currentSizeIndex];
    this.resetDataPoints();
    
    console.log('========');
    console.log(`Benchmark started for size ${this.currentMessageSize} at ${this.startTime}`);
    console.log('========');
    await this.publish(this.flowId, this.componentId, 'startMessageGeneration', {});
  }

  private async endBenchmark(): Promise<void> {
    this.endTime = Date.now();
    this.logger.log(`Benchmark ended for size ${this.currentMessageSize} at ${this.endTime}`);

    await this.publish(this.flowId, this.componentId, 'stopMessageGeneration', {});

    console.log('========');
    console.log('waiting 2s for benchmark to finish');
    console.log('========');
    await new Promise(resolve => setTimeout(resolve, 2000)); // wait for benchmark to finish

    if (this.currentSizeIndex < this.messageSizes.length - 1) {
      this.currentSizeIndex++;
      await this.startNextSizeBenchmark();
    } else {
      const result = this.analyzeBenchmark();
      await this.publish(this.flowId, this.componentId, 'benchmarkResult', result);
      await this.display(this.flowId, this.componentId, 'benchmark-results', { results: result });
      console.log('!!!!!!!!');
      console.log('benchmark-results: success');
      console.log('!!!!!!!!');
    }
  }

  private async addDataPoint(processingTime: number, size: number): Promise<void> {
    // console.log('addDataPoint', size, processingTime);
    if (!this.dataPoints[size]) {
      this.dataPoints[size] = [];
    }
    this.dataPoints[size].push(processingTime);
    // this.logger.log(`Added data point for size ${size}: ${processingTime}ms (Total: ${this.dataPoints[size].length})`);
    
    if (this.dataPoints[size].length === this.messagesPerSize) {
      console.log('////////// end benchmark', this.dataPoints[size].length, '===', this.messagesPerSize);
      await this.endBenchmark();
    }
  }

  private async startNextSizeBenchmark(): Promise<void> {
    this.currentMessageSize = this.messageSizes[this.currentSizeIndex];
    this.logger.log(`Starting benchmark for next size: ${this.currentMessageSize}`);
    await this.publish(this.flowId, this.componentId, 'nextMessageSize', { size: this.currentMessageSize });
    console.log('~~~~~~ startNextSizeBenchmark', this.currentMessageSize);
    await new Promise(resolve => setTimeout(resolve, 2000)); // wait for nextMessageSize to propagate
    await this.publish(this.flowId, this.componentId, 'startMessageGeneration', {});
    await this.publish(this.flowId, this.componentId, 'startMessageGeneration', {});
    await this.publish(this.flowId, this.componentId, 'startMessageGeneration', {});
  }

  private analyzeBenchmark(): BenchmarkResults {
    const results: BenchmarkResults = {};

    for (const size of this.messageSizes) {
      const times = this.dataPoints[size] || [];
      const messageCount = times.length;
      const totalTime = times.reduce((sum, time) => sum + time, 0);
      const averageProcessingTime = messageCount > 0 ? totalTime / messageCount : 0;
      const messagesPerSecond = messageCount > 0 ? (messageCount / (totalTime / 1000)).toFixed(2) : '0';

      results[size] = {
        messageCount,
        averageProcessingTime,
        messagesPerSecond,
      };

      this.logger.log(`Analysis for size ${size}: Count=${messageCount}, Avg=${averageProcessingTime.toFixed(2)}ms, MPS=${messagesPerSecond}`);
    }

    return results;
  }

  private resetDataPoints(): void {
    this.dataPoints = {};
    this.messageSizes.forEach(size => {
      this.dataPoints[size] = [];
    });
    this.logger.log('Data points reset');
  }
}

interface BenchmarkResult {
  messageCount: number;
  averageProcessingTime: number;
  messagesPerSecond: string;
}

interface BenchmarkResults {
  [size: number]: BenchmarkResult;
}