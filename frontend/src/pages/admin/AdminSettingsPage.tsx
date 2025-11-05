import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  ArrowLeft,
  Clock,
  Shield,
  Bell,
  Globe,
  Database,
  Mail,
  Users,
  Calendar,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  Server,
  Key,
  FileText
} from 'lucide-react';

interface SystemSettings {
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
  };
}

interface ApiKeyInfo {
  clientId: string;
  currentSecretActive: boolean;
  currentSecretPreview: string;
  newSecretActive: boolean;
  newSecretPreview: string;
  isDualKeyMode: boolean;
  lastUpdated: string;
}

function ApiKeyManager() {
  const [keyInfo, setKeyInfo] = useState<ApiKeyInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [newSecret, setNewSecret] = useState('');

  useEffect(() => {
    fetchKeyInfo();
  }, []);

  const fetchKeyInfo = async () => {
    try {
      const response = await fetch('http://localhost:3001/admin/api-keys/42/info', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setKeyInfo(data);
      }
    } catch (error) {
      console.error('Failed to fetch API key info:', error);
    }
  };

  const handleSetNewSecret = async () => {
    if (!newSecret || newSecret.length < 10) {
      alert('올바른 Secret 키를 입력해주세요 (최소 10자)');
      return;
    }

    if (!confirm('새로운 Secret 키를 추가하시겠습니까?\n\nDual key 모드가 활성화되어 현재 키와 새 키 모두 유효하게 됩니다.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/admin/api-keys/42/set-new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ secret: newSecret }),
      });

      if (response.ok) {
        alert('새로운 Secret 키가 추가되었습니다.');
        setNewSecret('');
        fetchKeyInfo();
      } else {
        alert('Secret 키 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to set new secret:', error);
      alert('Secret 키 추가 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteSecret = async () => {
    if (!confirm('새 Secret 키를 primary로 승격하시겠습니까?\n\n이전 키는 제거되며, 새 키만 사용하게 됩니다.\n개발 환경에서는 서버가 자동으로 재시작됩니다.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/admin/api-keys/42/promote', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ ${data.message}\n\n${data.note}`);

        // 개발 환경이면 서버 재시작 대기
        if (!data.restartRequired) {
          setTimeout(() => {
            alert('서버가 재시작되었습니다. 이제 OAuth 로그인이 정상적으로 작동합니다.');
            fetchKeyInfo();
          }, 3000);
        } else {
          fetchKeyInfo();
        }
      } else {
        alert('Secret 키 승격에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to promote secret:', error);
      alert('Secret 키 승격 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveNewSecret = async () => {
    if (!confirm('새 Secret 키를 제거하시겠습니까?\n\n현재 키만 사용하게 됩니다.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/admin/api-keys/42/remove-new', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        alert('새 Secret 키가 제거되었습니다.');
        fetchKeyInfo();
      } else {
        alert('Secret 키 제거에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to remove new secret:', error);
      alert('Secret 키 제거 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!keyInfo) {
    return <div className="text-center py-4">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Dual Key 모드 상태 */}
      {keyInfo.isDualKeyMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center">
            <Info className="w-5 h-5 text-blue-600 mr-3" />
            <div>
              <p className="font-medium text-blue-800">Dual Key 모드 활성화</p>
              <p className="text-sm text-blue-600">현재 키와 새 키가 모두 유효합니다. 42 서버에서 키 전환이 완료되면 '새 키 승격'을 실행하세요.</p>
            </div>
          </div>
        </div>
      )}

      {/* 현재 키 정보 */}
      <div className="border border-gray-200 rounded-md p-4">
        <h4 className="font-medium text-gray-900 mb-3">현재 Primary Key</h4>
        <div className="space-y-2">
          <div>
            <p className="text-sm text-gray-600">Client ID</p>
            <p className="font-mono text-sm">{keyInfo.clientId}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Secret (미리보기)</p>
            <p className="font-mono text-sm">{keyInfo.currentSecretPreview}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">마지막 업데이트</p>
            <p className="text-sm">{keyInfo.lastUpdated ? new Date(keyInfo.lastUpdated).toLocaleString('ko-KR') : 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* 새 키 정보 */}
      {keyInfo.isDualKeyMode && (
        <div className="border border-green-200 bg-green-50 rounded-md p-4">
          <h4 className="font-medium text-green-900 mb-3">새 Secondary Key</h4>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-green-700">Secret (미리보기)</p>
              <p className="font-mono text-sm text-green-900">{keyInfo.newSecretPreview}</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={handlePromoteSecret} disabled={loading}>
              <CheckCircle className="w-4 h-4 mr-2" />
              새 키 승격
            </Button>
            <Button variant="outline" onClick={handleRemoveNewSecret} disabled={loading}>
              <AlertTriangle className="w-4 h-4 mr-2" />
              새 키 제거
            </Button>
          </div>
        </div>
      )}

      {/* 새 키 추가 */}
      {!keyInfo.isDualKeyMode && (
        <div className="border border-gray-200 rounded-md p-4">
          <h4 className="font-medium text-gray-900 mb-3">새 Secret 키 추가</h4>
          <p className="text-sm text-gray-600 mb-4">
            42에서 발급받은 새 Secret 키를 입력하세요. 추가하면 현재 키와 새 키 모두 유효하게 됩니다.
          </p>
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder="새 Secret 키 입력"
              value={newSecret}
              onChange={(e) => setNewSecret(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSetNewSecret} disabled={loading}>
              <Key className="w-4 h-4 mr-2" />
              추가
            </Button>
          </div>
        </div>
      )}

      {/* 사용 방법 안내 */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <h4 className="font-medium text-gray-900 mb-2">Dual Key 사용 방법</h4>
        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
          <li>42 Intra에서 새 Secret 키를 미리 확인합니다</li>
          <li>"새 Secret 키 추가"를 통해 새 키를 등록합니다 (Dual Key 모드 시작)</li>
          <li>42에서 키 전환이 완료되면 "새 키 승격"을 실행합니다</li>
          <li>이전 키는 자동으로 제거되고, 새 키가 Primary가 됩니다</li>
        </ol>
      </div>
    </div>
  );
}

export function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
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
    },
  });

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('http://localhost:3001/admin/settings', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        console.error('Failed to fetch settings:', response.status);
        alert('설정을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      alert('설정을 불러오는데 실패했습니다.');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);

    try {
      const response = await fetch('http://localhost:3001/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        console.error('Failed to save settings:', response.status);
        alert('설정 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('설정 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const updateReservationSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      reservation: { ...prev.reservation, [key]: value }
    }));
  };

  const updateNotificationSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value }
    }));
  };

  const updateSecuritySetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      security: { ...prev.security, [key]: value }
    }));
  };

  const updateSystemSetting = async (key: string, value: any) => {
    // 유지보수 모드는 즉시 서버에 반영
    if (key === 'maintenanceMode') {
      try {
        const response = await fetch('http://localhost:3001/admin/system/maintenance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: JSON.stringify({ enabled: value }),
        });

        if (response.ok) {
          setSettings(prev => ({
            ...prev,
            system: { ...prev.system, [key]: value }
          }));
          alert(`유지보수 모드가 ${value ? '활성화' : '비활성화'}되었습니다.`);
        } else {
          alert('유지보수 모드 변경에 실패했습니다.');
        }
      } catch (error) {
        console.error('Failed to toggle maintenance mode:', error);
        alert('유지보수 모드 변경 중 오류가 발생했습니다.');
      }
    } else {
      setSettings(prev => ({
        ...prev,
        system: { ...prev.system, [key]: value }
      }));
    }
  };

  const handleDangerousAction = async (action: string) => {
    const actionNames = {
      'database-reset': '데이터베이스 초기화',
      'system-restart': '시스템 재시작',
      'clear-logs': '로그 파일 삭제'
    };

    const actionName = actionNames[action] || action;

    if (!confirm(`정말로 ${actionName}를 실행하시겠습니까?\n\n이 작업은 되돌릴 수 없으며 시스템에 영향을 줄 수 있습니다.`)) {
      return;
    }

    if (!confirm(`한 번 더 확인합니다.\n\n${actionName}를 실행하시겠습니까?`)) {
      return;
    }

    try {
      let endpoint = '';
      switch (action) {
        case 'system-restart':
          endpoint = '/admin/system/restart';
          break;
        case 'database-reset':
          endpoint = '/admin/system/database-reset';
          break;
        case 'clear-logs':
          endpoint = '/admin/system/clear-logs';
          break;
        default:
          return;
      }

      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        alert(`${actionName}가 성공적으로 실행되었습니다.`);

        if (action === 'system-restart') {
          alert('시스템이 재시작됩니다. 잠시 후 다시 접속해주세요.');
        }
      } else {
        alert(`${actionName} 실행에 실패했습니다.`);
      }
    } catch (error) {
      console.error(`Failed to execute ${action}:`, error);
      alert(`${actionName} 실행 중 오류가 발생했습니다.`);
    }
  };

  const handleApiKeyTest = async () => {
    try {
      const response = await fetch('http://localhost:3001/admin/system/test-api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        alert(`API 키 테스트 결과:\n\n42 API: ${result.api42 ? '✅ 연결됨' : '❌ 연결 실패'}\n이메일 API: ${result.email ? '✅ 연결됨' : '❌ 연결 실패'}`);
      } else {
        alert('API 키 테스트에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to test API keys:', error);
      alert('API 키 테스트 중 오류가 발생했습니다.');
    }
  };

  const renderToggle = (checked: boolean, onChange: (value: boolean) => void, disabled = false) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <div className={`w-11 h-6 bg-gray-200 rounded-full peer ${checked ? 'peer-checked:bg-blue-600' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <div className={`absolute top-[2px] left-[2px] bg-white border border-gray-300 rounded-full h-5 w-5 transition-transform ${checked ? 'translate-x-5' : ''}`}></div>
      </div>
    </label>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* 헤더 섹션 */}
        <div className="mb-8">
          <Link to="/admin">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              관리자 대시보드로 돌아가기
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-2">
                <Settings className="w-8 h-8 text-gray-600 mr-3" />
                <h1 className="text-3xl font-bold text-gray-900">시스템 설정</h1>
              </div>
              <p className="text-gray-600">시스템 환경 설정 및 정책을 관리합니다</p>
            </div>
            <div className="flex items-center space-x-3">
              {saved && (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="text-sm">설정이 저장되었습니다</span>
                </div>
              )}
              <Button onClick={handleSave} disabled={loading}>
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    설정 저장
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* 시스템 상태 알림 */}
        {settings.system.maintenanceMode && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-orange-600 mr-3" />
                <div>
                  <p className="font-medium text-orange-800">유지보수 모드가 활성화되어 있습니다</p>
                  <p className="text-sm text-orange-600">일반 사용자는 시스템에 접근할 수 없습니다.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 예약 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                예약 설정
              </CardTitle>
              <CardDescription>
                회의실 예약 관련 정책을 관리합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  최대 사전 예약 일수
                </label>
                <Input
                  type="number"
                  value={settings.reservation.maxDaysAdvance}
                  onChange={(e) => updateReservationSetting('maxDaysAdvance', parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">몇 일 전까지 예약을 허용할지 설정합니다</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  최대 예약 시간 (시간)
                </label>
                <Input
                  type="number"
                  value={settings.reservation.maxDuration}
                  onChange={(e) => updateReservationSetting('maxDuration', parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">한 번에 예약할 수 있는 최대 시간</p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700">주말 예약 허용</p>
                  <p className="text-sm text-gray-500">토요일, 일요일 예약 가능 여부</p>
                </div>
                {renderToggle(
                  settings.reservation.allowWeekends,
                  (value) => updateReservationSetting('allowWeekends', value)
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700">관리자 승인 필요</p>
                  <p className="text-sm text-gray-500">예약 시 관리자 승인이 필요한지 설정</p>
                </div>
                {renderToggle(
                  settings.reservation.requireApproval,
                  (value) => updateReservationSetting('requireApproval', value)
                )}
              </div>
            </CardContent>
          </Card>

          {/* 알림 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                알림 설정
              </CardTitle>
              <CardDescription>
                시스템 알림 및 이메일 설정을 관리합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700">이메일 알림 활성화</p>
                  <p className="text-sm text-gray-500">이메일을 통한 알림 발송</p>
                </div>
                {renderToggle(
                  settings.notifications.emailEnabled,
                  (value) => updateNotificationSetting('emailEnabled', value)
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  예약 알림 시간 (시간 전)
                </label>
                <Input
                  type="number"
                  value={settings.notifications.reminderHours}
                  onChange={(e) => updateNotificationSetting('reminderHours', parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">예약 시간 몇 시간 전에 알림을 보낼지 설정</p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700">관리자 알림</p>
                  <p className="text-sm text-gray-500">새 예약, 취소 시 관리자에게 알림</p>
                </div>
                {renderToggle(
                  settings.notifications.adminNotifications,
                  (value) => updateNotificationSetting('adminNotifications', value)
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700">시스템 경고 알림</p>
                  <p className="text-sm text-gray-500">시스템 오류 및 경고 알림</p>
                </div>
                {renderToggle(
                  settings.notifications.systemAlerts,
                  (value) => updateNotificationSetting('systemAlerts', value)
                )}
              </div>
            </CardContent>
          </Card>

          {/* 보안 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                보안 설정
              </CardTitle>
              <CardDescription>
                사용자 인증 및 보안 정책을 관리합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  세션 타임아웃 (분)
                </label>
                <Input
                  type="number"
                  value={settings.security.sessionTimeout}
                  onChange={(e) => updateSecuritySetting('sessionTimeout', parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">로그인 세션 유지 시간</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  최대 로그인 시도 횟수
                </label>
                <Input
                  type="number"
                  value={settings.security.maxLoginAttempts}
                  onChange={(e) => updateSecuritySetting('maxLoginAttempts', parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">계정 잠금 전 허용되는 로그인 실패 횟수</p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700">강력한 비밀번호 요구</p>
                  <p className="text-sm text-gray-500">특수문자, 숫자 포함 필수</p>
                </div>
                {renderToggle(
                  settings.security.requireStrongPassword,
                  (value) => updateSecuritySetting('requireStrongPassword', value)
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700">2단계 인증</p>
                  <p className="text-sm text-gray-500">OTP 또는 SMS 인증 활성화</p>
                </div>
                {renderToggle(
                  settings.security.twoFactorAuth,
                  (value) => updateSecuritySetting('twoFactorAuth', value)
                )}
              </div>
            </CardContent>
          </Card>

          {/* 시스템 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Server className="w-5 h-5 mr-2" />
                시스템 설정
              </CardTitle>
              <CardDescription>
                시스템 운영 및 유지보수 설정을 관리합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700">유지보수 모드</p>
                  <p className="text-sm text-gray-500">시스템 점검 시 사용자 접근 차단</p>
                </div>
                {renderToggle(
                  settings.system.maintenanceMode,
                  (value) => updateSystemSetting('maintenanceMode', value)
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700">디버그 모드</p>
                  <p className="text-sm text-gray-500">개발 및 디버깅용 상세 로그</p>
                </div>
                {renderToggle(
                  settings.system.debugMode,
                  (value) => updateSystemSetting('debugMode', value)
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  백업 보관 기간 (일)
                </label>
                <Input
                  type="number"
                  value={settings.system.backupRetentionDays}
                  onChange={(e) => updateSystemSetting('backupRetentionDays', parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">자동 백업 파일 보관 기간</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  로그 레벨
                </label>
                <select
                  value={settings.system.logLevel}
                  onChange={(e) => updateSystemSetting('logLevel', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="error">Error (오류만)</option>
                  <option value="warn">Warning (경고 이상)</option>
                  <option value="info">Info (정보 이상)</option>
                  <option value="debug">Debug (모든 로그)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">시스템 로그 상세도 수준</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 42 API 키 관리 (Dual Key) */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="w-5 h-5 mr-2" />
              42 API 키 관리 (Dual Key)
            </CardTitle>
            <CardDescription>
              무중단 키 교체를 위한 Dual Key 방식으로 42 API 키를 관리합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ApiKeyManager />
          </CardContent>
        </Card>

        {/* 시스템 정보 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="w-5 h-5 mr-2" />
              시스템 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600">시스템 버전</p>
                <p className="font-medium">42ERP v1.0.0</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">데이터베이스</p>
                <p className="font-medium">PostgreSQL 14.x</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">서버 상태</p>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="font-medium text-green-600">정상</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 위험한 작업 */}
        <Card className="mt-6 border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertTriangle className="w-5 h-5 mr-2" />
              위험한 작업
            </CardTitle>
            <CardDescription className="text-red-600">
              다음 작업들은 시스템에 영향을 줄 수 있습니다. 주의해서 실행하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
                onClick={() => handleDangerousAction('database-reset')}
              >
                <Database className="w-4 h-4 mr-2" />
                데이터베이스 초기화
              </Button>
              <Button
                variant="outline"
                className="text-orange-600 border-orange-300 hover:bg-orange-50"
                onClick={() => handleDangerousAction('system-restart')}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                시스템 재시작
              </Button>
              <Button
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
                onClick={() => handleDangerousAction('clear-logs')}
              >
                <FileText className="w-4 h-4 mr-2" />
                로그 파일 삭제
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}