import { Injectable, Logger } from '@nestjs/common';
import { Component } from '../interfaces/component.interface';

@Injectable()
export class ComponentRegistry {
  private keys: Map<string, Component> = new Map();
  private components: Map<string, Component> = new Map();
  private readonly logger = new Logger(ComponentRegistry.name);

  registerComponent(component: Component) {
    this.logger.log(`Registering component: ${component.id}`);
    this.components.set(component.id, component);
  }

  getComponent(id: string): Component | undefined {
    const component = this.components.get(id);
    if (!component) {
      this.logger.warn(`Component id not found: ${id}`);
    }
    return component;
  }

  registerComponentId(key, id) {
    const component = this.getComponent(id.id);
    this.keys.set(key, component);
  }

  getComponentId (key): Component | undefined {
    const component = this.keys.get(key);
    if (!component) {
      this.logger.warn(`Component key not found: ${key}`);
    }
    return component;
  }

  getAllComponents(): Component[] {
    return Array.from(this.components.values());
  }
}