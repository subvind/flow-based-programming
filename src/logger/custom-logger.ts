import { ConsoleLogger, Injectable, Inject } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CustomLogger extends ConsoleLogger {
  constructor(
    private logId: string,
  ) {
    super(logId);
    this.setLogLevels(['log', 'error', 'warn', 'debug', 'verbose']);
  }

  log(message: string, context?: string) {
    this.printMessage(message, 'log', context);
    // this.emitLogEvent('log', message);
  }

  warn(message: string, context?: string) {
    this.printMessage(message, 'warn', context);
    // this.emitLogEvent('warn', message);
  }

  error(message: string, trace?: string, context?: string) {
    this.printMessage(message, 'error', context);
    // this.emitLogEvent('error', message);
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
    console.log(`[${this.getNow()}] [${logLevel.toUpperCase()}] [${this.logId}] ${output}`);
  }

  private getNow(): string {
    return new Date().toISOString();
  }

  static write_to_file(message: string) {
    const logFile = path.join(process.cwd(), 'start:dev.stdout.txt');
    fs.appendFile(logFile, message, (err) => {
      if (err) {
        console.error('Failed to write to log file:', err);
      }
    });
  }

  static clearSTDOUT() {
    const logFile = path.join(process.cwd(), 'start:dev.stdout.txt');
    try {
      fs.writeFileSync(logFile, '');
      console.log(`Log file cleared at ${logFile}`);
    } catch (error) {
      console.error('Failed to clear log file:', error);
    }
  }
}