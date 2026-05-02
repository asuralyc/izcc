import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { Event } from './events/event.entity';
import { EventsModule } from './events/events.module';
import { Registration } from './events/registration.entity';
import { UploadsModule } from './uploads/uploads.module';
import { User } from './users/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST') ?? 'localhost',
        port: Number(config.get<string>('DB_PORT') ?? 5432),
        username: config.get<string>('DB_USER') ?? 'izcc',
        password: config.get<string>('DB_PASSWORD') ?? 'izcc_dev_password',
        database: config.get<string>('DB_NAME') ?? 'izcc',
        entities: [User, Event, Registration],
        synchronize: config.get<string>('DB_SYNC') !== 'false',
        logging: config.get<string>('DB_LOGGING') === 'true'
      })
    }),
    AuthModule,
    EventsModule,
    UploadsModule
  ]
})
export class AppModule {}
