import { Controller, Get, Post, Render, Body, Res, Req, UseGuards, Query } from '@nestjs/common';
import { Response, Request } from 'express';

@Controller()
export class AppController {
  constructor() {}

  @Get()
  @Render('index')
  async root(@Req() req: Request) {
    return { message: 'Flow Based Programming' };
  }
}