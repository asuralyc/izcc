import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminEventsController } from './admin-events.controller';
import { Event } from './event.entity';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { Registration } from './registration.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Event, Registration])],
  controllers: [EventsController, AdminEventsController],
  providers: [EventsService],
  exports: [EventsService]
})
export class EventsModule {}

