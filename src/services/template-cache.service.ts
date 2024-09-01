import { Injectable } from '@nestjs/common';

@Injectable()
export class TemplateCacheService {
  private cache: Map<string, string> = new Map();

  setTemplate(key: string, content: string): void {
    this.cache.set(key, content);
  }

  getTemplate(key: string): string | undefined {
    return this.cache.get(key);
  }

  hasTemplate(key: string): boolean {
    return this.cache.has(key);
  }
}