import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { Api42Module } from './api-42/api-42.module';
import { RoomModule } from './room/room.module';
import { ReservationModule } from './reservation/reservation.module';
import { AdminModule } from './admin/admin.module';
import { ClubModule } from './club/club.module';
import { User } from './user/entities/user.entity';
import { Info } from './user/entities/info.entity';
import { Room } from './room/entities/room.entity';
import { Reservation } from './reservation/entities/reservation.entity';
import { SystemSettings } from './admin/entities/system-settings.entity';
import { ActivityLog } from './admin/entities/activity-log.entity';
import { Club } from './club/entities/club.entity';
import { ClubMember } from './club/entities/club-member.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: +configService.get<number>('DATABASE_PORT', 5432),
        username: configService.get('DATABASE_USER'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [
          User,
          Info,
          Room,
          Reservation,
          SystemSettings,
          ActivityLog,
          Club,
          ClubMember,
        ],
        synchronize: true, // Development mode - auto-create tables
        timezone: 'Asia/Seoul', // 한국 시간대 설정
        // Connection pool settings
        extra: {
          max: 10, // Maximum number of connections
          min: 2, // Minimum number of connections
          idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
          connectionTimeoutMillis: 10000, // Connection timeout (10 seconds)
        },
        // Retry settings
        retryAttempts: 3,
        retryDelay: 2000,
        // Auto reconnect
        keepConnectionAlive: true,
        // Connection logging
        logging: configService.get('NODE_ENV') === 'development' ? ['error', 'warn'] : false,
      }),
      inject: [ConfigService],
    }),
    UserModule,
    AuthModule,
    Api42Module,
    RoomModule,
    ReservationModule,
    AdminModule,
    ClubModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
