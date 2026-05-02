import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { CreateEventDto, UpdateEventDto } from './events.dto';
import { Event, EventStatus } from './event.entity';
import { Registration } from './registration.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly events: Repository<Event>,
    @InjectRepository(Registration)
    private readonly registrations: Repository<Registration>
  ) {}

  async listPublic(user?: User) {
    const events = await this.events
      .createQueryBuilder('event')
      .loadRelationCountAndMap('event.registrationCount', 'event.registrations')
      .where('event.status = :status', { status: EventStatus.Published })
      .andWhere('event.archived_at IS NULL')
      .orderBy('event.created_at', 'DESC')
      .getMany();

    return this.withUserRegistration(events, user);
  }

  async getPublic(id: string, user?: User) {
    const event = await this.events
      .createQueryBuilder('event')
      .loadRelationCountAndMap('event.registrationCount', 'event.registrations')
      .where('event.id = :id', { id })
      .andWhere('event.status = :status', { status: EventStatus.Published })
      .andWhere('event.archived_at IS NULL')
      .getOne();

    if (!event) {
      throw new NotFoundException('找不到活動');
    }

    return (await this.withUserRegistration([event], user))[0];
  }

  async listAdmin() {
    const events = await this.events
      .createQueryBuilder('event')
      .loadRelationCountAndMap('event.registrationCount', 'event.registrations')
      .orderBy('event.created_at', 'DESC')
      .getMany();

    return events.map((event) => this.toEventResponse(event));
  }

  async getAdmin(id: string) {
    return this.toEventResponse(await this.requireEvent(id));
  }

  async create(dto: CreateEventDto) {
    const event = this.events.create({
      title: dto.title.trim(),
      coverImageUrl: dto.coverImageUrl?.trim() || null,
      content: dto.content,
      status: EventStatus.Draft
    });

    return this.toEventResponse(await this.events.save(event));
  }

  async update(id: string, dto: UpdateEventDto) {
    const event = await this.requireEvent(id);

    if (dto.title !== undefined) {
      event.title = dto.title.trim();
    }
    if (dto.coverImageUrl !== undefined) {
      event.coverImageUrl = dto.coverImageUrl?.trim() || null;
    }
    if (dto.content !== undefined) {
      event.content = dto.content;
    }
    if (dto.status !== undefined) {
      event.status = dto.status;
    }

    return this.toEventResponse(await this.events.save(event));
  }

  async publish(id: string) {
    const event = await this.requireEvent(id);
    if (event.archivedAt) {
      throw new BadRequestException('封存中的活動不能發佈，請先解封存');
    }
    event.status = EventStatus.Published;
    return this.toEventResponse(await this.events.save(event));
  }

  async unpublish(id: string) {
    const event = await this.requireEvent(id);
    event.status = EventStatus.Unlisted;
    return this.toEventResponse(await this.events.save(event));
  }

  async archive(id: string) {
    const event = await this.requireEvent(id);
    event.archivedAt = new Date();
    event.status = EventStatus.Unlisted;
    return this.toEventResponse(await this.events.save(event));
  }

  async unarchive(id: string) {
    const event = await this.requireEvent(id);
    event.archivedAt = null;
    return this.toEventResponse(await this.events.save(event));
  }

  async remove(id: string) {
    const event = await this.requireEvent(id);
    const registrationCount = await this.registrations.count({
      where: { event: { id } }
    });

    if (registrationCount > 0) {
      throw new ConflictException('已有報名者的活動不能刪除，請改用封存');
    }

    await this.events.remove(event);
    return { deleted: true };
  }

  async register(eventId: string, user: User) {
    const event = await this.requireEvent(eventId);
    if (event.status !== EventStatus.Published || event.archivedAt) {
      throw new BadRequestException('此活動目前未開放報名');
    }

    const existing = await this.registrations.findOne({
      where: { event: { id: eventId }, user: { id: user.id } }
    });
    if (existing) {
      throw new ConflictException('你已經報名過此活動');
    }

    const registration = this.registrations.create({ event, user });
    await this.registrations.save(registration);

    return { registered: true };
  }

  async cancelRegistration(eventId: string, user: User) {
    const registration = await this.registrations.findOne({
      where: { event: { id: eventId }, user: { id: user.id } }
    });
    if (!registration) {
      throw new NotFoundException('找不到報名紀錄');
    }
    await this.registrations.remove(registration);
    return { registered: false };
  }

  async listRegistrations(eventId: string) {
    await this.requireEvent(eventId);
    const registrations = await this.registrations.find({
      where: { event: { id: eventId } },
      relations: { user: true },
      order: { createdAt: 'ASC' }
    });

    return registrations.map((registration) => ({
      id: registration.id,
      createdAt: registration.createdAt,
      user: {
        id: registration.user.id,
        account: registration.user.account,
        email: registration.user.email,
        displayName: registration.user.displayName
      }
    }));
  }

  private async requireEvent(id: string) {
    const event = await this.events
      .createQueryBuilder('event')
      .loadRelationCountAndMap('event.registrationCount', 'event.registrations')
      .where('event.id = :id', { id })
      .getOne();

    if (!event) {
      throw new NotFoundException('找不到活動');
    }

    return event;
  }

  private async withUserRegistration(events: Event[], user?: User) {
    if (!user || events.length === 0) {
      return events.map((event) => ({
        ...this.toEventResponse(event),
        isRegistered: false
      }));
    }

    const eventIds = events.map((event) => event.id);
    const registrations = await this.registrations
      .createQueryBuilder('registration')
      .leftJoin('registration.event', 'event')
      .where('registration.user_id = :userId', { userId: user.id })
      .andWhere('event.id IN (:...eventIds)', { eventIds })
      .select('event.id', 'eventId')
      .getRawMany<{ eventId: string }>();
    const registeredIds = new Set(registrations.map((item) => item.eventId));

    return events.map((event) => ({
      ...this.toEventResponse(event),
      isRegistered: registeredIds.has(event.id)
    }));
  }

  private toEventResponse(event: Event) {
    return {
      id: event.id,
      title: event.title,
      coverImageUrl: event.coverImageUrl,
      content: event.content,
      status: event.status,
      archivedAt: event.archivedAt,
      registrationCount: Number((event as Event & { registrationCount?: number }).registrationCount ?? 0),
      createdAt: event.createdAt,
      updatedAt: event.updatedAt
    };
  }
}

