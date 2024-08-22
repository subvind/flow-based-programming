import { Logger, Controller, Get, Post, Render, Body, Param, Res, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { EventTriggerComponent } from '../components/event-trigger/event-trigger.handler';

@Controller()
export class AppController {
  private readonly logger = new Logger('AppController');

  constructor(private eventTriggerComponent: EventTriggerComponent) {}

  @Get()
  @Render('index')
  async root(@Req() req: Request) {
    return { message: 'steam engine = chart + document + logger // FBP' };
  }

  /**
   * svelte app generated in:
   * ./src/public/chart/*
   */

  @Get('document')
  @Render('document/index')
  async documentIndex(@Req() req: Request) {
    return { message: 'document - steam engine // FBP' };
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
}