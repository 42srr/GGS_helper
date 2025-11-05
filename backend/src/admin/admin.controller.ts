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
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequirePermissions } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { Api42ConfigService } from '../api-42/api-42-config.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@RequirePermissions('admin:*')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly api42ConfigService: Api42ConfigService,
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
    return await this.adminService.getBackupList();
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
    console.log('Admin system stats endpoint called');
    try {
      const stats = await this.adminService.getSystemStats();
      console.log('System stats result:', stats);
      return stats;
    } catch (error) {
      console.error('System stats error:', error);
      throw error;
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
      return {
        error: 'Database reset failed',
        message: error.message,
        timestamp: new Date().toISOString(),
      };
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
      return {
        error: 'Failed to clear logs',
        message: error.message,
        timestamp: new Date().toISOString(),
      };
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
      return {
        error: 'API key tests failed',
        message: error.message,
        timestamp: new Date().toISOString(),
      };
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

  // 42 API Key 관리
  @Get('api-keys/42/info')
  async get42ApiKeyInfo() {
    return this.api42ConfigService.getConfigInfo();
  }

  @Post('api-keys/42/set-new')
  async set42NewApiKey(@Body() body: { secret: string }) {
    if (!body.secret || body.secret.length < 10) {
      throw new HttpException('Invalid secret key', HttpStatus.BAD_REQUEST);
    }

    this.api42ConfigService.setNewClientSecret(body.secret);

    return {
      success: true,
      message: '새로운 42 API Secret이 추가되었습니다.',
      note: 'Dual key 모드가 활성화되었습니다. 현재 키와 새 키 모두 유효합니다.',
    };
  }

  @Post('api-keys/42/promote')
  async promote42ApiKey() {
    const info = this.api42ConfigService.getConfigInfo();
    if (!info.newSecretActive) {
      throw new HttpException('No new secret to promote', HttpStatus.BAD_REQUEST);
    }

    this.api42ConfigService.promoteNewSecret();

    // 서버 자동 재시작 (개발 환경에서만 권장)
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        console.log('🔄 Auto-restarting server to apply new OAuth secret...');
        process.exit(0); // nodemon/pm2가 자동으로 재시작함
      }, 1000);
    }

    return {
      success: true,
      message: '새로운 42 API Secret이 primary로 승격되었습니다.',
      note: process.env.NODE_ENV === 'development'
        ? '서버가 자동으로 재시작됩니다...'
        : '운영 환경에서는 수동으로 서버를 재시작해주세요.',
      restartRequired: process.env.NODE_ENV !== 'development',
    };
  }

  @Post('api-keys/42/remove-new')
  async remove42NewApiKey() {
    const info = this.api42ConfigService.getConfigInfo();
    if (!info.newSecretActive) {
      throw new HttpException('No new secret to remove', HttpStatus.BAD_REQUEST);
    }

    this.api42ConfigService.removeNewSecret();

    return {
      success: true,
      message: '새로운 42 API Secret이 제거되었습니다.',
      note: '현재 키만 사용합니다.',
    };
  }

}
