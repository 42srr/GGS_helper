import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { BackupSchedulerService } from './backup-scheduler.service';
import { SystemSettings } from './entities/system-settings.entity';
import { ActivityLog } from './entities/activity-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SystemSettings, ActivityLog]),
  ],
  controllers: [AdminController],
  providers: [AdminService, BackupSchedulerService],
  exports: [AdminService],
})
export class AdminModule {}
