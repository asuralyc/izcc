import {
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { User } from '../users/user.entity';
import { Event } from './event.entity';

@Entity('registrations')
@Index(['event', 'user'], { unique: true })
export class Registration {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Event, (event) => event.registrations, {
    nullable: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'event_id' })
  event!: Event;

  @ManyToOne(() => User, (user) => user.registrations, {
    nullable: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

