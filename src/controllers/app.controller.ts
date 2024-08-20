import { Logger, Controller, Get, Post, Render, Body, Res, Req, UseGuards, Query } from '@nestjs/common';
import { Response, Request } from 'express';
import { EventTriggerComponent } from '../components/event-trigger.component';

@Controller()
export class AppController {
  private readonly logger = new Logger('AppController');

  constructor(private eventTriggerComponent: EventTriggerComponent) {}

  @Get()
  @Render('index')
  async root(@Req() req: Request) {
    return { message: 'Flow Based Programming' };
  }

  @Post('trigger-event')
  async trigger_event(
    @Body() body: { 
      flowId: string; 
      componentId: string; 
      eventId: string, 
      data: any 
    }, 
    @Res() res: Response
  ) {
    this.logger.log(`[trigger-event] [${body.flowId}] [${body.componentId}] [${body.eventId}]`)
    await this.eventTriggerComponent.handleEvent('triggerEvent', body);
    res.sendStatus(200);
  }
}