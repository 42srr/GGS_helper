import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsBoolean, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsBoolean()
  isReservationBanned?: boolean;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  banUntil?: Date | null;
}
