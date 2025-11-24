import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  Max,
} from 'class-validator';

export class CreateReservationDto {
  @IsNumber()
  roomId: number;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsNumber()
  @Min(4)
  @Max(12)
  attendees?: number;

  @IsOptional()
  @IsString()
  teamName?: string;
}
