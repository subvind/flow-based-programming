import { Injectable, Logger } from '@nestjs/common';
import { Component } from '../interfaces/component.interface';

@Injectable()
export class ComponentRegistry {
  private components: Map<string, Component> = new Map();
  private readonly logger = new Logger(ComponentRegistry.name);

  registerComponent(component: Component) {
    const key = `${component.flowId}.${component.componentId}`;
    this.logger.log(`Registering component: ${key}`);
    this.components.set(key, component);
  }

  getComponent(flowId: string, componentId: string): Component | undefined {
    const key = `${flowId}.${componentId}`;
    const component = this.components.get(key);
    if (!component) {
      this.logger.warn(`Component not found: ${key}`);
    }
    return component;
  }
}