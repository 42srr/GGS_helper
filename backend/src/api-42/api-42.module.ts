import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Api42Service } from './api-42.service';
import { Api42ConfigService } from './api-42-config.service';
import { Api42AdminController } from './api-42-admin.controller';
import { Api42SchedulerService } from './api-42-scheduler.service';

@Module({
  imports: [
    ConfigModule,
  ],
  controllers: [Api42AdminController],
  providers: [Api42Service, Api42ConfigService, Api42SchedulerService],
  exports: [Api42Service, Api42ConfigService],
})
export class Api42Module {}
