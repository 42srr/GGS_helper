import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Api42ConfigService } from './api-42-config.service';

@Injectable()
export class Api42SchedulerService implements OnModuleInit, OnModuleDestroy {
  private intervalId: NodeJS.Timeout | null = null;

  constructor(private api42ConfigService: Api42ConfigService) {}

  onModuleInit() {
    // 5분마다 예약된 키 활성화 체크
    this.startScheduler();
    console.log('42 API key scheduler started - checking every 5 minutes');
  }

  onModuleDestroy() {
    this.stopScheduler();
    console.log('42 API key scheduler stopped');
  }

  private startScheduler() {
    // 즉시 한 번 체크
    this.checkScheduledKeys();

    // 5분마다 체크 (300000ms = 5분)
    this.intervalId = setInterval(() => {
      this.checkScheduledKeys();
    }, 300000);
  }

  private stopScheduler() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private checkScheduledKeys() {
    try {
      // getClientSecret 호출 시 자동으로 예약된 키 체크가 수행됨
      const currentSecret = this.api42ConfigService.getClientSecret();

      if (currentSecret) {
        console.log(`[Scheduler] API key check completed at ${new Date().toISOString()}`);
      }
    } catch (error) {
      console.error('[Scheduler] Error checking scheduled keys:', error);
    }
  }

  // 수동으로 스케줄 체크 트리거
  forceCheck() {
    console.log('[Scheduler] Manual check triggered');
    this.checkScheduledKeys();
  }
}