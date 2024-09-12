import { CustomLogger } from '../../logger/custom-logger';
import { Injectable, Inject } from '@nestjs/common';
import { ComponentBase } from '../../bases/component.base';
import { BackplaneService } from 'src/services/backplane.service';
import { Server } from 'socket.io';
import { TemplateCacheService } from 'src/services/template-cache.service';

@Injectable()
export class BenchmarkAnalyzerComponent extends ComponentBase {
  public logger;
  private startTime: number | null = null;
  private endTime: number | null = null;
  private dataPoints: { [size: number]: number[] } = {};
  private currentMessageSize: number = 1;
  public ports = {
    inputs: [
      'any.publish.startBenchmark',
      'any.publish.endBenchmark',
      'any.publish.dataPoint',
      'any.publish.setMessageSize'
    ],
    outputs: [
      'any.publish.benchmarkResult'
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
      case "startBenchmark": {
        this.startBenchmark();
        break;
      }
      case "endBenchmark": {
        await this.endBenchmark();
        break;
      }
      case "dataPoint": {
        this.addDataPoint(data.processingTime, data.size);
        break;
      }
      case "setMessageSize": {
        this.setMessageSize(data.size);
        break;
      }
    }
  }

  private startBenchmark(): void {
    this.startTime = Date.now();
    this.dataPoints = {};
    this.logger.log(`Benchmark started at ${this.startTime}`);
  }

  private async endBenchmark(): Promise<void> {
    this.endTime = Date.now();
    this.logger.log(`Benchmark ended at ${this.endTime}`);
    const result = this.analyzeBenchmark();
    await this.publish(this.flowId, this.componentId, 'benchmarkResult', result);
  }

  private addDataPoint(processingTime: number, size: number): void {
    if (!this.dataPoints[size]) {
      this.dataPoints[size] = [];
    }
    this.dataPoints[size].push(processingTime);
  }

  private setMessageSize(size: number): void {
    this.currentMessageSize = size;
  }

  private analyzeBenchmark(): any {
    const totalDuration = this.endTime! - this.startTime!;
    const results = {};

    for (const [size, times] of Object.entries(this.dataPoints)) {
      const messageCount = times.length;
      const averageProcessingTime = times.reduce((sum, time) => sum + time, 0) / messageCount;
      const messagesPerSecond = (messageCount / totalDuration) * 1000;

      results[size] = {
        messageCount,
        averageProcessingTime,
        messagesPerSecond
      };
    }

    return {
      totalDuration,
      results
    };
  }
}