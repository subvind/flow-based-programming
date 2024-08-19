import { ConsoleLogger, Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CustomLogger extends ConsoleLogger {
  constructor(
    private componentId: string,
    @Inject('FLOW_SERVICE') private client: ClientProxy
  ) {
    super(componentId);
    this.setLogLevels(['log', 'error', 'warn', 'debug', 'verbose']);
  }

  log(message: string, context?: string) {
    this.printMessage(message, 'log', context);
    this.emitLogEvent('log', message);
  }

  warn(message: string, context?: string) {
    this.printMessage(message, 'warn', context);
    this.emitLogEvent('warn', message);
  }

  error(message: string, trace?: string, context?: string) {
    this.printMessage(message, 'error', context);
    this.emitLogEvent('error', message);
    if (trace) {
      this.printMessage(trace, 'error', context);
    }
  }

  debug(message: string, context?: string) {
    this.printMessage(message, 'debug', context);
  }

  verbose(message: string, context?: string) {
    this.printMessage(message, 'verbose', context);
  }

  private printMessage(message: string, logLevel: string, context?: string) {
    const output = context ? `[${context}] ${message}` : message;
    console.log(`[${this.getTimestamp()}] [${logLevel.toUpperCase()}] ${output}`);
  }

  private async emitLogEvent(level: string, message: string) {
    await this.client.emit('componentEvent', {
      componentId: this.componentId,
      eventName: 'logger',
      data: {
        level,
        message,
      },
    }).toPromise();
  }

  static writeToFile(message: string) {
    const logFile = path.join(process.cwd(), 'STDOUT.txt');
    fs.appendFile(logFile, message, (err) => {
      if (err) {
        console.error('Failed to write to log file:', err);
      }
    });
  }

  static clearSTDOUT() {
    const logFile = path.join(process.cwd(), 'STDOUT.txt');
    try {
      fs.writeFileSync(logFile, '');
      console.log(`Log file cleared at ${logFile}`);
    } catch (error) {
      console.error('Failed to clear log file:', error);
    }
  }
}