import { PartialType } from '@nestjs/mapped-types';
import { CreateReservationDto } from './create-reservation.dto';
import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateReservationDto extends PartialType(CreateReservationDto) {
  @IsOptional()
  @IsString()
  @IsIn(['pending', 'confirmed', 'finished', 'cancelled'])
  status?: string;
}
