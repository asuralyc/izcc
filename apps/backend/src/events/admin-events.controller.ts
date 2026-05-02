import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { UserRole } from '../users/user.entity';
import { CreateEventDto, UpdateEventDto } from './events.dto';
import { EventsService } from './events.service';

@Controller('admin/events')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin)
export class AdminEventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  list() {
    return this.events.listAdmin();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.events.getAdmin(id);
  }

  @Post()
  create(@Body() dto: CreateEventDto) {
    return this.events.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.events.update(id, dto);
  }

  @Post(':id/publish')
  publish(@Param('id') id: string) {
    return this.events.publish(id);
  }

  @Post(':id/unpublish')
  unpublish(@Param('id') id: string) {
    return this.events.unpublish(id);
  }

  @Post(':id/archive')
  archive(@Param('id') id: string) {
    return this.events.archive(id);
  }

  @Post(':id/unarchive')
  unarchive(@Param('id') id: string) {
    return this.events.unarchive(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.events.remove(id);
  }

  @Get(':id/registrations')
  registrations(@Param('id') id: string) {
    return this.events.listRegistrations(id);
  }
}

