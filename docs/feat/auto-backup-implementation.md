# 자동 백업 기능 구현 계획서

## 📋 문서 정보
- **작성일**: 2026-01-12
- **기능명**: 자동 백업 시스템 (Automated Backup System)
- **우선순위**: High
- **담당 모듈**: Backend (AdminModule)

---

## 🎯 목표

데이터베이스 자동 백업 시스템을 구현하여 데이터 손실을 방지하고, 시스템 복구 능력을 강화합니다.

### 핵심 가치
1. **안정성**: 정기적인 자동 백업으로 데이터 손실 방지
2. **효율성**: 스케줄링을 통한 자동화로 관리 부담 감소
3. **유연성**: 백업 주기 및 보관 정책 설정 가능
4. **신뢰성**: 백업 성공/실패 알림 및 모니터링

---

## 📐 아키텍처 설계

### 시스템 구성도

```
┌─────────────────────────────────────────────────────────┐
│                   Backup Scheduler                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │  @Cron('0 2 * * *')  // 매일 새벽 2시            │   │
│  │  handleScheduledBackup()                         │   │
│  └──────────────────┬──────────────────────────────┘   │
│                     │                                    │
│                     ▼                                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │           AdminService                           │   │
│  │  - createBackup()                                │   │
│  │  - cleanupOldBackups()                          │   │
│  │  - getBackupStats()                             │   │
│  └──────────────────┬──────────────────────────────┘   │
│                     │                                    │
│                     ▼                                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │         PostgreSQL Database                      │   │
│  │  pg_dump → backups/backup_TIMESTAMP.sql         │   │
│  └─────────────────────────────────────────────────┘   │
│                     │                                    │
│                     ▼                                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │      Notification Service                        │   │
│  │  - Slack 알림                                    │   │
│  │  - 이메일 알림 (선택)                            │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 기술 스택

### Backend
- **NestJS ScheduleModule**: Cron 작업 관리
- **@nestjs/schedule**: 스케줄링 데코레이터
- **pg_dump**: PostgreSQL 백업 유틸리티
- **Node.js fs 모듈**: 파일 시스템 관리

### 백업 저장소
- **로컬 파일 시스템**: `${PROJECT_ROOT}/backups/`
- **(선택) 클라우드 스토리지**: AWS S3, Google Cloud Storage

---

## 📝 구현 상세

### 1. Backend: 자동 백업 스케줄러 구현

#### 1.1 BackupScheduler 서비스 생성

**파일**: `backend/src/admin/backup-scheduler.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
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

      await this.adminService.cleanupOldBackups(retentionDays);
      this.logger.log(`✅ Old backups cleaned up (retention: ${retentionDays} days)`);
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
    } catch (error) {
      this.logger.error('Failed to send backup notification:', error);
    }
  }
}
```

#### 1.2 AdminService에 백업 정리 메서드 추가

**파일**: `backend/src/admin/admin.service.ts`

```typescript
/**
 * 오래된 백업 파일 삭제
 * @param retentionDays 보관 기간 (일)
 */
async cleanupOldBackups(retentionDays: number): Promise<number> {
  const backupDir = path.join(process.cwd(), 'backups');

  if (!fs.existsSync(backupDir)) {
    return 0;
  }

  const files = fs.readdirSync(backupDir);
  const sqlFiles = files.filter((file) => file.endsWith('.sql'));

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  let deletedCount = 0;

  for (const file of sqlFiles) {
    const filePath = path.join(backupDir, file);
    const stats = fs.statSync(filePath);

    if (stats.birthtime < cutoffDate) {
      fs.unlinkSync(filePath);
      deletedCount++;
      console.log(`🗑️ Deleted old backup: ${file}`);
    }
  }

  // 활동 로그 기록
  if (deletedCount > 0) {
    await this.logActivity(
      ActivityType.BACKUP_CREATED,
      '오래된 백업 정리',
      `${deletedCount}개의 오래된 백업 파일이 삭제되었습니다`,
      undefined,
      { deletedCount, retentionDays },
      'info',
    );
  }

  return deletedCount;
}

/**
 * 백업 스케줄 상태 조회
 */
async getBackupScheduleStatus(): Promise<any> {
  const settings = await this.getSettings();

  return {
    enabled: true, // 자동 백업 활성화 여부
    schedule: '매일 새벽 2시',
    retentionDays: settings.system?.backupRetentionDays || 30,
    lastBackup: await this.getLastBackupTime(),
    nextBackup: this.getNextBackupTime(),
  };
}

/**
 * 다음 백업 예정 시간 계산
 */
private getNextBackupTime(): string {
  const now = new Date();
  const next = new Date(now);

  // 새벽 2시로 설정
  next.setHours(2, 0, 0, 0);

  // 현재 시간이 새벽 2시 이후라면 다음 날로 설정
  if (now.getHours() >= 2) {
    next.setDate(next.getDate() + 1);
  }

  return next.toISOString();
}
```

#### 1.3 AdminModule 업데이트

**파일**: `backend/src/admin/admin.module.ts`

```typescript
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
  providers: [
    AdminService,
    BackupSchedulerService, // 추가
  ],
  exports: [AdminService],
})
export class AdminModule {}
```

#### 1.4 AdminController에 백업 스케줄 조회 엔드포인트 추가

**파일**: `backend/src/admin/admin.controller.ts`

```typescript
/**
 * 백업 스케줄 상태 조회
 */
@Get('backup/schedule')
async getBackupSchedule() {
  return this.adminService.getBackupScheduleStatus();
}
```

---

### 2. Frontend: 자동 백업 상태 표시

#### 2.1 AdminBackupPage 업데이트

**파일**: `frontend/src/pages/admin/AdminBackupPage.tsx`

```typescript
// 상태 추가
const [backupSchedule, setBackupSchedule] = useState({
  enabled: false,
  schedule: '매일 새벽 2시',
  retentionDays: 30,
  nextBackup: '없음',
});

// 백업 스케줄 정보 조회
const fetchBackupSchedule = async () => {
  try {
    const response = await fetch('http://localhost:3001/admin/backup/schedule', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      setBackupSchedule(data);
    }
  } catch (error) {
    console.error('Failed to fetch backup schedule:', error);
  }
};

// useEffect에 추가
useEffect(() => {
  fetchBackups();
  fetchBackupSchedule();
}, []);

// stats 배열 수정
const stats = [
  {
    label: '총 백업 수',
    value: backups.length.toString(),
    icon: FileArchive,
    color: 'text-blue-600'
  },
  {
    label: '총 백업 크기',
    value: totalSize,
    icon: HardDrive,
    color: 'text-green-600'
  },
  {
    label: '마지막 백업',
    value: formatRelativeTime(lastBackupTime),
    icon: Clock,
    color: 'text-purple-600'
  },
  {
    label: '자동 백업',
    value: backupSchedule.enabled ? '활성화' : '비활성화',
    icon: RefreshCw,
    color: backupSchedule.enabled ? 'text-orange-600' : 'text-gray-400'
  },
];
```

#### 2.2 백업 스케줄 정보 카드 추가

```typescript
{/* 백업 스케줄 정보 카드 추가 */}
<Card>
  <CardHeader>
    <CardTitle className="flex items-center">
      <Calendar className="w-5 h-5 mr-2" />
      백업 스케줄
    </CardTitle>
    <CardDescription>
      자동 백업 스케줄 및 보관 정책
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-700">백업 주기</p>
        <p className="text-sm text-gray-500">{backupSchedule.schedule}</p>
      </div>
      <Badge variant={backupSchedule.enabled ? "default" : "secondary"}>
        {backupSchedule.enabled ? "활성화" : "비활성화"}
      </Badge>
    </div>

    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-700">보관 기간</p>
        <p className="text-sm text-gray-500">{backupSchedule.retentionDays}일</p>
      </div>
    </div>

    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-700">다음 백업 예정</p>
        <p className="text-sm text-gray-500">
          {backupSchedule.nextBackup !== '없음'
            ? formatRelativeTime(backupSchedule.nextBackup)
            : '없음'
          }
        </p>
      </div>
    </div>
  </CardContent>
</Card>
```

---

### 3. SystemSettings에 백업 설정 추가

#### 3.1 설정 페이지에 백업 설정 카드 추가

**파일**: `frontend/src/pages/admin/AdminSettingsPage.tsx`

```typescript
// SystemSettings 인터페이스에 추가
interface SystemSettings {
  reservation: { ... };
  notifications: { ... };
  backup: {
    enabled: boolean;
    schedule: string; // cron expression
    retentionDays: number;
  };
}

// 백업 설정 카드 추가
<Card>
  <CardHeader>
    <CardTitle className="flex items-center">
      <Database className="w-5 h-5 mr-2" />
      백업 설정
    </CardTitle>
    <CardDescription>
      자동 백업 스케줄 및 보관 정책 설정
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-gray-700">자동 백업 활성화</p>
        <p className="text-sm text-gray-500">매일 새벽 2시 자동 백업</p>
      </div>
      {renderToggle(
        settings.backup.enabled,
        (value) => updateBackupSetting('enabled', value)
      )}
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        백업 보관 기간 (일)
      </label>
      <Input
        type="number"
        value={settings.backup.retentionDays}
        onChange={(e) => updateBackupSetting('retentionDays', parseInt(e.target.value))}
        className="w-full"
      />
      <p className="text-xs text-gray-500 mt-1">
        설정한 기간보다 오래된 백업은 자동 삭제됩니다
      </p>
    </div>
  </CardContent>
</Card>
```

---

## 🔄 Cron 표현식 참고

```
# ┌───────────── 분 (0 - 59)
# │ ┌───────────── 시 (0 - 23)
# │ │ ┌───────────── 일 (1 - 31)
# │ │ │ ┌───────────── 월 (1 - 12)
# │ │ │ │ ┌───────────── 요일 (0 - 6) (일요일=0)
# │ │ │ │ │
# * * * * *

# 예시:
'0 2 * * *'      # 매일 새벽 2시
'0 3 * * 0'      # 매주 일요일 새벽 3시
'0 0 1 * *'      # 매월 1일 자정
'*/30 * * * *'   # 30분마다
'0 */6 * * *'    # 6시간마다
```

---

## 📊 데이터베이스 스키마

SystemSettings 테이블에 백업 관련 설정 추가:

```sql
-- 백업 설정 예시
INSERT INTO system_settings (key, value, description) VALUES
('backup.enabled', true, '자동 백업 활성화 여부'),
('backup.schedule', '0 2 * * *', '백업 스케줄 (Cron 표현식)'),
('backup.retentionDays', 30, '백업 보관 기간 (일)');
```

---

## 🧪 테스트 계획

### 1. 단위 테스트

```typescript
describe('BackupSchedulerService', () => {
  it('should create backup on schedule', async () => {
    // Cron 작업 실행 테스트
  });

  it('should cleanup old backups', async () => {
    // 오래된 백업 삭제 테스트
  });

  it('should send notification on success', async () => {
    // 성공 알림 전송 테스트
  });

  it('should send notification on failure', async () => {
    // 실패 알림 전송 테스트
  });
});
```

### 2. 통합 테스트

- 스케줄러가 정해진 시간에 백업을 생성하는지 확인
- 백업 파일이 올바르게 저장되는지 확인
- 보관 기간 초과 파일이 삭제되는지 확인
- Slack 알림이 정상 전송되는지 확인

### 3. 수동 테스트

```bash
# 1. Cron 작업 즉시 실행 (테스트용)
curl -X POST http://localhost:3001/admin/backup/test-schedule \
  -H "Authorization: Bearer <token>"

# 2. 백업 목록 확인
curl http://localhost:3001/admin/backup/list \
  -H "Authorization: Bearer <token>"

# 3. 스케줄 상태 확인
curl http://localhost:3001/admin/backup/schedule \
  -H "Authorization: Bearer <token>"
```

---

## 📦 배포 가이드

### 1. 환경 변수 설정

```bash
# .env
BACKUP_ENABLED=true
BACKUP_SCHEDULE="0 2 * * *"  # 매일 새벽 2시
BACKUP_RETENTION_DAYS=30
```

### 2. 백업 디렉토리 생성

```bash
mkdir -p backups
chmod 755 backups
```

### 3. PostgreSQL 백업 권한 확인

```bash
# pg_dump 실행 가능 여부 확인
which pg_dump
pg_dump --version
```

### 4. 서버 시간대 확인

```bash
# 서버 시간대가 Asia/Seoul인지 확인
timedatectl
```

---

## ⚠️ 주의사항

### 1. 디스크 공간 관리
- 백업 파일은 시간이 지남에 따라 디스크 공간을 많이 차지할 수 있음
- `backupRetentionDays` 설정을 통해 오래된 백업 자동 삭제
- 디스크 사용량 모니터링 필요

### 2. 백업 시간 설정
- 사용자 트래픽이 적은 시간대 선택 (새벽 2시 권장)
- 백업 중 데이터베이스 성능 저하 가능성 고려

### 3. 보안
- 백업 파일에는 민감한 정보가 포함되므로 접근 권한 관리 필수
- 클라우드 스토리지 사용 시 암호화 권장

### 4. 복원 테스트
- 정기적으로 백업 파일을 이용한 복원 테스트 수행
- 백업 파일의 무결성 검증

---

## 🚀 향후 개선 사항

### Phase 2: 클라우드 백업
- AWS S3, Google Cloud Storage 연동
- 백업 파일 자동 업로드
- 오프사이트 백업 구현

### Phase 3: 증분 백업
- 전체 백업 + 증분 백업 조합
- 백업 속도 및 저장 공간 최적화

### Phase 4: 백업 모니터링 대시보드
- 백업 성공률 차트
- 디스크 사용량 모니터링
- 백업 이력 관리

### Phase 5: 다중 백업 전략
- 로컬 + 클라우드 이중 백업
- 여러 시간대 백업 (일간, 주간, 월간)
- Point-in-Time Recovery (PITR) 지원

---

## 📚 참고 자료

- [NestJS Schedule Module Documentation](https://docs.nestjs.com/techniques/task-scheduling)
- [PostgreSQL pg_dump Documentation](https://www.postgresql.org/docs/current/app-pgdump.html)
- [Cron Expression Generator](https://crontab.guru/)
- [Node.js fs Module Documentation](https://nodejs.org/api/fs.html)

---

## ✅ 체크리스트

### Backend 구현
- [ ] `BackupSchedulerService` 생성
- [ ] `@Cron` 데코레이터로 일간 백업 스케줄 설정
- [ ] `cleanupOldBackups()` 메서드 구현
- [ ] `getBackupScheduleStatus()` 메서드 구현
- [ ] `AdminModule`에 `BackupSchedulerService` 등록
- [ ] Slack 알림 연동 (성공/실패)
- [ ] 활동 로그 기록

### Frontend 구현
- [ ] 백업 스케줄 정보 조회 API 연동
- [ ] 자동 백업 상태 표시 (활성화/비활성화)
- [ ] 다음 백업 예정 시간 표시
- [ ] 백업 보관 기간 표시
- [ ] 설정 페이지에 백업 설정 카드 추가

### 테스트
- [ ] 단위 테스트 작성
- [ ] 통합 테스트 수행
- [ ] 수동 백업 생성 테스트
- [ ] 자동 백업 스케줄 테스트
- [ ] 오래된 백업 삭제 테스트
- [ ] Slack 알림 테스트

### 문서화
- [ ] API 문서 업데이트
- [ ] 배포 가이드 작성
- [ ] 운영 매뉴얼 작성
- [ ] 백업 복원 절차 문서화

---

## 📌 구현 우선순위

1. **High Priority** (필수)
   - BackupSchedulerService 구현
   - 일간 자동 백업 스케줄
   - 오래된 백업 자동 삭제
   - 백업 상태 API 및 UI

2. **Medium Priority** (권장)
   - Slack 알림 연동
   - 백업 설정 페이지
   - 활동 로그 기록

3. **Low Priority** (선택)
   - 주간 백업 추가
   - 클라우드 백업 연동
   - 백업 모니터링 대시보드

---

## ✅ 구현 완료 (2026-01-12)

### 구현된 기능

#### Backend
1. **BackupSchedulerService** ✅
   - 매일 새벽 2시 자동 백업 (설정 가능)
   - 주간 백업 (일요일 새벽 3시)
   - 오래된 백업 자동 정리
   - Slack 알림 연동

2. **AdminService 확장** ✅
   - `cleanupOldBackups()`: 보관 기간 기반 백업 삭제
   - `getBackupScheduleStatus()`: 백업 스케줄 상태 조회
   - `updateBackupSchedule()`: 백업 설정 업데이트 (시간, 활성화, 보관기간)
   - `formatBackupSchedule()`: 백업 시간 한국어 포맷팅
   - `getNextBackupTime()`: 다음 백업 예정 시간 계산

3. **AdminController API** ✅
   - `GET /admin/backup/schedule`: 백업 스케줄 조회
   - `PUT /admin/backup/schedule`: 백업 스케줄 설정

4. **SystemSettings 스키마** ✅
   - `system.backupEnabled`: 자동 백업 활성화 여부
   - `system.backupRetentionDays`: 백업 보관 기간 (일)
   - `system.backupHour`: 백업 실행 시간 (0-23)

#### Frontend
1. **AdminBackupPage 개선** ✅
   - 백업 스케줄 표시 (활성화 여부, 시간, 다음 백업 예정)
   - 백업 스케줄 편집 UI
   - 백업 시간 선택 (0-23시, 한국어 표시)
   - 백업 보관 기간 설정 (1-365일)
   - 토글 스위치로 자동 백업 활성화/비활성화

### 파일 변경 내역

#### 신규 파일
- `backend/src/admin/backup-scheduler.service.ts`

#### 수정 파일
- `backend/src/admin/admin.service.ts`
- `backend/src/admin/admin.controller.ts`
- `backend/src/admin/admin.module.ts`
- `frontend/src/pages/admin/AdminBackupPage.tsx`

### 사용 방법

1. **자동 백업 설정**
   - Admin 페이지 → 데이터 백업 메뉴
   - "백업 스케줄" 카드에서 "설정" 버튼 클릭
   - 자동 백업 활성화 토글
   - 백업 시간 선택 (0-23시)
   - 백업 보관 기간 설정 (일)
   - "저장" 버튼 클릭

2. **백업 스케줄 확인**
   - 백업 주기: 매일 설정된 시간 (기본: 오전 2시)
   - 다음 백업 예정 시간 표시
   - 활성화 상태 확인

3. **설정값**
   - 기본 백업 시간: 오전 2시
   - 기본 보관 기간: 30일
   - 설정 가능 시간: 0-23시 (1시간 단위)
   - 설정 가능 보관 기간: 1-365일

### 배포 체크리스트

- [x] BackupSchedulerService 구현
- [x] 백업 시간 설정 기능
- [x] 백업 활성화/비활성화 기능
- [x] 백업 보관 기간 설정
- [x] 프론트엔드 UI 구현
- [x] 다음 백업 예정 시간 표시
- [ ] 동적 Cron 스케줄 업데이트 (현재는 재시작 필요)
- [ ] 백업 성공/실패 통계
- [ ] 백업 파일 크기 제한

### 알려진 제한사항

1. **동적 스케줄링**: 백업 시간 변경 시 애플리케이션 재시작 필요
   - 현재: `@Cron` 데코레이터가 하드코딩된 시간 사용
   - 개선 방향: `SchedulerRegistry`를 사용한 런타임 Cron 작업 관리

2. **Slack 알림**: Slack 웹훅 URL 설정 필요
   - Admin → 시스템 설정에서 Slack 웹훅 URL 등록

---

**작성자**: Claude Sonnet 4.5
**구현 완료일**: 2026-01-12
**검토 완료**: Backend 구현 및 Frontend UI 완료
