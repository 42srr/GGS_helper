/**
 * 시스템 설정 인터페이스
 */
export interface SystemSettings {
  reservation: {
    maxDaysAdvance: number;
    maxDuration: number;
    allowWeekends: boolean;
    requireApproval: boolean;
  };
  notifications: {
    emailEnabled: boolean;
    reminderHours: number;
    adminNotifications: boolean;
    systemAlerts: boolean;
    slackWebhookUrl: string;
    slackEnabled: boolean;
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    requireStrongPassword: boolean;
    twoFactorAuth: boolean;
  };
  system: {
    maintenanceMode: boolean;
    debugMode: boolean;
    backupRetentionDays: number;
    logLevel: string;
    backupEnabled: boolean;
    backupHour: number;
  };
}

/**
 * 시스템 기본 설정값
 * 데이터베이스에 설정이 없을 경우 사용되는 기본값들
 */
export const DEFAULT_SETTINGS: SystemSettings = {
  reservation: {
    maxDaysAdvance: 30,
    maxDuration: 8,
    allowWeekends: false,
    requireApproval: true,
  },
  notifications: {
    emailEnabled: true,
    reminderHours: 24,
    adminNotifications: true,
    systemAlerts: true,
    slackWebhookUrl: '',
    slackEnabled: false,
  },
  security: {
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    requireStrongPassword: true,
    twoFactorAuth: false,
  },
  system: {
    maintenanceMode: false,
    debugMode: false,
    backupRetentionDays: 30,
    logLevel: 'info',
    backupEnabled: true,
    backupHour: 2,
  },
};

/**
 * 예약 관련 기본값
 */
export const RESERVATION_DEFAULTS = {
  MAX_DAYS_ADVANCE: 30,
  MAX_DURATION_HOURS: 8,
  MIN_DURATION_HOURS: 1,
  CHECK_IN_WINDOW_MINUTES: 15,
} as const;

/**
 * 보안 관련 기본값
 */
export const SECURITY_DEFAULTS = {
  SESSION_TIMEOUT_MINUTES: 60,
  MAX_LOGIN_ATTEMPTS: 5,
  TOKEN_EXPIRATION_DAYS: 7,
  BCRYPT_ROUNDS: 10,
} as const;

/**
 * 백업 관련 기본값
 */
export const BACKUP_DEFAULTS = {
  RETENTION_DAYS: 30,
  SCHEDULE_CRON: '0 2 * * *', // 매일 새벽 2시
} as const;

export type DefaultSettingsType = SystemSettings;
