import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { Registration } from './registration.entity';

export enum EventStatus {
  Draft = 'draft',
  Published = 'published',
  Unlisted = 'unlisted'
}

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 180 })
  title!: string;

  @Column({ name: 'cover_image_url', type: 'varchar', nullable: true })
  coverImageUrl!: string | null;

  @Column({ type: 'text', default: '' })
  content!: string;

  @Column({ type: 'enum', enum: EventStatus, default: EventStatus.Draft })
  status!: EventStatus;

  @Column({ name: 'archived_at', type: 'timestamptz', nullable: true })
  archivedAt!: Date | null;

  @OneToMany(() => Registration, (registration) => registration.event)
  registrations!: Registration[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
