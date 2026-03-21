import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Param,
  Query,
  Res,
  UseGuards,
  Body,
  UseInterceptors,
  UploadedFile,
  HttpException,
  HttpStatus,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequirePermissions } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@RequirePermissions('admin:*')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private readonly adminService: AdminService,
  ) {}

  @Post('backup/create')
  async createBackup() {
    const backupId = await this.adminService.createBackup();
    return {
      message: 'Backup created successfully',
      backupId,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('backup/download/:id')
  async downloadBackup(@Param('id') id: string, @Res() res: Response) {
    try {
      const backupBuffer = await this.adminService.getBackupFile(id);

      res.set({
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename=backup_${id}_${new Date().toISOString().split('T')[0]}.sql`,
      });

      res.send(backupBuffer);
    } catch (error) {
      res.status(404).json({ error: 'Backup file not found' });
    }
  }

  @Delete('backup/:id')
  async deleteBackup(@Param('id') id: string) {
    await this.adminService.deleteBackup(id);
    return { message: 'Backup deleted successfully' };
  }

  @Get('backup/list')
  async getBackupList() {
    const backups = await this.adminService.getBackupList();
    const stats = await this.adminService.getBackupStats();
    return {
      backups,
      ...stats,
    };
  }

  @Get('backup/schedule')
  async getBackupSchedule() {
    return this.adminService.getBackupScheduleStatus();
  }

  @Put('backup/schedule')
  async updateBackupSchedule(@Body() body: { enabled: boolean; retentionDays: number; backupHour?: number }) {
    await this.adminService.updateBackupSchedule(body.enabled, body.retentionDays, body.backupHour);
    return {
      message: 'Backup schedule updated successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('backup/restore')
  async restoreBackup(@Body() body: { backupId: string }) {
    await this.adminService.restoreBackup(body.backupId);
    return {
      message: 'Backup restoration initiated',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('system/stats')
  async getSystemStats() {
    try {
      const stats = await this.adminService.getSystemStats();
      return stats;
    } catch (error) {
      this.logger.error(`Failed to get system stats: ${error.message}`, error.stack);
      throw new InternalServerErrorException('시스템 통계 조회 중 오류가 발생했습니다.');
    }
  }

  @Get('settings')
  async getSettings() {
    return await this.adminService.getSettings();
  }

  @Put('settings')
  async updateSettings(@Body() settings: any) {
    await this.adminService.updateSettings(settings);
    return {
      message: 'Settings updated successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('settings/test-discord')
  async testDiscordWebhook(@Body() body: { webhookUrl: string }) {
    try {
      await this.adminService.testDiscordWebhook(body.webhookUrl);
      return {
        message: 'Discord test message sent successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          message: 'Failed to send Discord test message',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('system/maintenance')
  async toggleMaintenanceMode(@Body() body: { enabled: boolean }) {
    await this.adminService.setMaintenanceMode(body.enabled);
    return {
      message: `Maintenance mode ${body.enabled ? 'enabled' : 'disabled'}`,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('system/restart')
  async restartSystem() {
    // 실제 운영환경에서는 주의 필요
    return {
      message: 'System restart initiated',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('system/database-reset')
  async resetDatabase() {
    // 매우 위험한 작업 - 실제 운영환경에서는 추가 인증 필요
    try {
      await this.adminService.resetDatabase();
      return {
        message: 'Database reset completed',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Database reset failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('데이터베이스 초기화 중 오류가 발생했습니다.');
    }
  }

  @Post('system/clear-logs')
  async clearLogs() {
    try {
      await this.adminService.clearLogs();
      return {
        message: 'Logs cleared successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to clear logs: ${error.message}`, error.stack);
      throw new InternalServerErrorException('로그 정리 중 오류가 발생했습니다.');
    }
  }

  @Post('system/test-api-keys')
  async testApiKeys() {
    try {
      const results = await this.adminService.testApiKeys();
      return {
        message: 'API key tests completed',
        ...results,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`API key tests failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('API 키 테스트 중 오류가 발생했습니다.');
    }
  }

  @Get('statistics')
  async getStatistics(@Query('period') period?: string) {
    const selectedPeriod = period || '30d';
    return await this.adminService.getStatistics(selectedPeriod);
  }

  @Get('statistics/export')
  async exportStatistics(@Res() res: Response) {
    try {
      const buffer = await this.adminService.exportStatistics();

      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=statistics_report_${new Date().toISOString().split('T')[0]}.xlsx`,
      });

      res.send(buffer);
    } catch (error) {
      res.status(500).json({ error: 'Failed to export statistics' });
    }
  }

  @Get('activities/recent')
  async getRecentActivities(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit) : 10;
    return await this.adminService.getRecentActivities(limitNum);
  }

  @Post('activities/create-samples')
  async createSampleActivities() {
    await this.adminService.createSampleActivities();
    return {
      message: 'Sample activities created successfully',
      timestamp: new Date().toISOString(),
    };
  }

}
