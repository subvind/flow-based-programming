import { Injectable, Logger } from '@nestjs/common';
import { Component } from '../interfaces/component.interface';

@Injectable()
export class ComponentRegistry {
  private idComponents: Map<string, Component> = new Map();
  private readonly logger = new Logger(ComponentRegistry.name);

  registerComponentId(component: Component) {
    this.logger.log(`Registering componentId: ${component.componentId}`);
    console.log('set', component.componentId)
    this.idComponents.set(component.componentId, component);
  }

  getComponentId (componentId: string): Component | undefined {
    const component = this.idComponents.get(componentId);
    if (!component) {
      this.logger.warn(`componentId not found: ${componentId}`);
    }
    return component;
  }
}