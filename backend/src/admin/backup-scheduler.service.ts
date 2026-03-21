import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AdminService } from './admin.service';

@Injectable()
export class BackupSchedulerService {
  private readonly logger = new Logger(BackupSchedulerService.name);

  constructor(private readonly adminService: AdminService) {}

  /**
   * 매일 새벽 2시에 자동 백업 실행
   * Cron 표현식: '0 2 * * *'
   * - 분(0) 시(2) 일(*) 월(*) 요일(*)
   */
  @Cron('0 2 * * *', {
    name: 'daily-backup',
    timeZone: 'Asia/Seoul',
  })
  async handleDailyBackup() {
    this.logger.log('Starting scheduled daily backup...');

    try {
      const backupId = await this.adminService.createBackup();
      this.logger.log(`✅ Scheduled backup completed: ${backupId}`);

      // Slack 알림 전송
      await this.sendBackupNotification(backupId, 'success');

      // 오래된 백업 정리
      await this.cleanupOldBackups();
    } catch (error) {
      this.logger.error('❌ Scheduled backup failed:', error);
      await this.sendBackupNotification(null, 'failed', error.message);
    }
  }

  /**
   * 매주 일요일 새벽 3시에 주간 백업 실행
   */
  @Cron('0 3 * * 0', {
    name: 'weekly-backup',
    timeZone: 'Asia/Seoul',
  })
  async handleWeeklyBackup() {
    this.logger.log('Starting scheduled weekly backup...');

    try {
      const backupId = await this.adminService.createBackup();
      this.logger.log(`✅ Weekly backup completed: ${backupId}`);
    } catch (error) {
      this.logger.error('❌ Weekly backup failed:', error);
    }
  }

  /**
   * 백업 보관 기간에 따라 오래된 백업 삭제
   */
  private async cleanupOldBackups() {
    try {
      const settings = await this.adminService.getSettings();
      const retentionDays = settings.system?.backupRetentionDays || 30;

      const deletedCount = await this.adminService.cleanupOldBackups(retentionDays);
      this.logger.log(`✅ Old backups cleaned up: ${deletedCount} files deleted (retention: ${retentionDays} days)`);
    } catch (error) {
      this.logger.error('❌ Failed to cleanup old backups:', error);
    }
  }

  /**
   * 백업 결과 알림 전송
   */
  private async sendBackupNotification(
    backupId: string | null,
    status: 'success' | 'failed',
    errorMessage?: string,
  ) {
    try {
      const settings = await this.adminService.getSettings();

      if (!settings.notifications?.slackEnabled || !settings.notifications?.slackWebhookUrl) {
        return;
      }

      const message = status === 'success'
        ? {
            text: '✅ 자동 백업 완료',
            blocks: [
              {
                type: 'header',
                text: {
                  type: 'plain_text',
                  text: '✅ 데이터베이스 자동 백업 완료',
                  emoji: true,
                },
              },
              {
                type: 'section',
                fields: [
                  {
                    type: 'mrkdwn',
                    text: `*백업 ID:*\n${backupId}`,
                  },
                  {
                    type: 'mrkdwn',
                    text: `*완료 시간:*\n${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`,
                  },
                ],
              },
            ],
          }
        : {
            text: '❌ 자동 백업 실패',
            blocks: [
              {
                type: 'header',
                text: {
                  type: 'plain_text',
                  text: '❌ 데이터베이스 자동 백업 실패',
                  emoji: true,
                },
              },
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*오류 메시지:*\n\`\`\`${errorMessage || '알 수 없는 오류'}\`\`\``,
                },
              },
              {
                type: 'context',
                elements: [
                  {
                    type: 'mrkdwn',
                    text: `실패 시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`,
                  },
                ],
              },
            ],
          };

      await fetch(settings.notifications.slackWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });

      this.logger.log(`Backup notification sent to Slack: ${status}`);
    } catch (error) {
      this.logger.error('Failed to send backup notification:', error);
    }
  }
}
