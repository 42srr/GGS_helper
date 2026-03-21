import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationService } from './reservation.service';
import { ReservationController } from './reservation.controller';
import { Reservation } from './entities/reservation.entity';
import { Room } from '../room/entities/room.entity';
import { User } from '../user/entities/user.entity';
import { AdminModule } from '../admin/admin.module';
import { ImageService } from '../common/services/image.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, Room, User]),
    forwardRef(() => AdminModule),
  ],
  controllers: [ReservationController],
  providers: [ReservationService, ImageService],
  exports: [ReservationService],
})
export class ReservationModule {}
