import { Logger, Controller, Get, Post, Render, Body, Param, Res, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { EventTriggerComponent } from '../components/event-trigger/event-trigger.handler';

import { ComponentRegistry } from 'src/services/component-registry.service';
import { Connection } from 'src/interfaces/connection.interface';
import { Port } from 'src/interfaces/port.interface';
import { FlowExecutorService } from 'src/services/flow-executor.service';
import { TemplateCacheService } from 'src/services/template-cache.service';

@Controller()
export class AppController {
  private readonly logger = new Logger('AppController');
  
  constructor(
    private eventTriggerComponent: EventTriggerComponent,
    private componentRegistry: ComponentRegistry,
    private flowExecutorService: FlowExecutorService,
    private templateCacheService: TemplateCacheService
  ) {}

  @Get()
  @Render('index')
  async root(@Req() req: Request) {
    return { message: 'steam engine = chart + document + logger // FBP' };
  }

  /**
   * svelte app generated in:
   * ./src/public/chart/*
   */

  @Get('flows')
  @Render('flows/index')
  async flowsIndex(
    @Req() req: Request
  ) {
    const flows = await this.flowExecutorService.getFlows();
    return {
      message: 'flows - steam engine // FBP',
      flows
    };
  }

  @Get('flow/:flowId')
  @Render('flow/index')
  async flowComponents(
    @Param('flowId') flowId: string,
    @Req() req: Request
  ) {
    const flow = await this.flowExecutorService.getFlow(flowId);
    const components = flow.components.map(c => ({
      componentId: c.componentId,
      componentRef: c.componentRef
    }));

    return {
      message: 'flow - steam engine // FBP',
      flowId,
      components
    };
  }

  @Get('document/:flowId/:componentId')
  @Render('document/view')
  async documentView(
    @Param('flowId') flowId: string,
    @Param('componentId') componentId: string,
    @Req() req: Request
  ) {
    const flow = await this.flowExecutorService.getFlow(flowId);
    const components = flow.components.map(c => ({
      componentId: c.componentId,
      componentRef: c.componentRef
    }));

    let connections = []
    flow.connections.forEach((connection: Connection) => {
      connections.push({
        fromFlow: connection.fromFlow,
        fromComponent: connection.fromComponent,
        fromEvent: connection.fromEvent,
        toFlow: connection.toFlow,
        toComponent: connection.toComponent,
        toEvent: connection.toEvent,
      })
    })

    return {
      selected: {
        flowId,
        componentId
      },
      components,
      message: `${flowId}.${componentId} - document - steam engine // FBP`,
      connections
    };
  }

  @Get('documentComponent/:flowId/:componentId/:swimlaneId')
  @Render('document/component')
  async documentComponent(
    @Param('flowId') flowId: string,
    @Param('componentId') componentId: string,
    @Param('swimlaneId') swimlaneId: string,
  ) {
    const component = this.componentRegistry.getComponent(flowId, componentId);
  
    if (component) {
      return {
        component,
        swimlaneId
      };
    }
    return {
      component: null,
      swimlaneId
    };
  }

  @Get('documentConnections/:flowId/:componentId/:portId/:swimlaneId')
  @Render('document/connections')
  async documentConnections( 
    @Param('flowId') flowId: string, 
    @Param('componentId') componentId: string,
    @Param('portId') portId: string,
    @Param('swimlaneId') swimlaneId: string,
  ) {
    const params = { flowId, componentId, portId };
    const component = this.componentRegistry.getComponent(flowId, componentId);
    
    if (component) {
      let port: Port = await component.findPort(portId);

      let connections: Connection[] = await component.findConnections(port);

      connections.forEach((connection) => {
        if (port.direction === 'input') {
          connection.next = connection.connectedFrom;
        } else {
          connection.next = connection.connectedTo;
        }
      });

      if (port) {
        if (port.dataMethod === 'publish') {
          return {
            ...params,
            port,
            connections,
            swimlaneId
          };
        } else if (port.dataMethod === 'display') {
          let displayHtmxId = `${flowId}.${componentId}.${port.eventId}`;
          const cacheKey = `${flowId}.${componentId}.${port.eventId}`;
          const cachedTemplate = this.templateCacheService.getTemplate(cacheKey);
          
          return {
            ...params,
            port,
            displayHtmxId,
            swimlaneId,
            templateContent: cachedTemplate || 'Template not found'
          };
        }
      }
    }
    return {
      ...params,
      port: null,
      swimlaneId
    };
  }

  @Get('logger')
  @Render('logger/index')
  async loggerIndex(@Req() req: Request) {
    return { message: 'logger - steam engine // FBP' };
  }

  @Post('trigger-event/:flowComponentEvent')
  async triggerEvent(
    @Param('flowComponentEvent') flowComponentEvent: string,
    @Body() data: any,
    @Res() res: Response
  ) {
    const fceArray = flowComponentEvent.split('.');
    const flowId = fceArray[0];
    const componentId = fceArray[1];
    const eventId = fceArray[2];
    
    this.logger.log(`[trigger-event] [${flowId}] [${componentId}] [${eventId}]`);
    data._flowId = flowId;
    data._componentId = componentId;
    data._eventId = eventId;
    await this.eventTriggerComponent.handleEvent('triggerEvent', data);
    res.sendStatus(200);
  }

  @Get('template/:flowId/:componentId/:templateId')
  async getTemplate(
    @Param('flowId') flowId: string,
    @Param('componentId') componentId: string,
    @Param('templateId') templateId: string,
    @Res() res: Response
  ) {
    const cacheKey = `${flowId}.${componentId}.${templateId}`;
    const cachedTemplate = this.templateCacheService.getTemplate(cacheKey);

    if (cachedTemplate) {
      res.send(cachedTemplate);
    } else {
      res.status(404).send('Template not found');
    }
  }
}