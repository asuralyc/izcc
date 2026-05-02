import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { User } from '../users/user.entity';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  list(@CurrentUser() user?: User) {
    return this.events.listPublic(user);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  get(@Param('id') id: string, @CurrentUser() user?: User) {
    return this.events.getPublic(id, user);
  }

  @Post(':id/registrations')
  @UseGuards(JwtAuthGuard)
  register(@Param('id') id: string, @CurrentUser() user: User) {
    return this.events.register(id, user);
  }

  @Delete(':id/registrations')
  @UseGuards(JwtAuthGuard)
  cancelRegistration(@Param('id') id: string, @CurrentUser() user: User) {
    return this.events.cancelRegistration(id, user);
  }
}

