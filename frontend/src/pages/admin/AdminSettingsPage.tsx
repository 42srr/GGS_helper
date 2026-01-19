import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Settings,
  ArrowLeft,
  Bell,
  Calendar,
  Save,
  RefreshCw,
  CheckCircle,
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
    slackWebhookUrl: string;
    slackEnabled: boolean;
  };
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
      slackWebhookUrl: '',
      slackEnabled: false,
    },
  });

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testingSlack, setTestingSlack] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/settings`, {
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
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/settings`, {
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

  const handleTestSlackWebhook = async () => {
    if (!settings.notifications.slackWebhookUrl) {
      alert('Slack 웹훅 URL을 먼저 입력해주세요.');
      return;
    }

    setTestingSlack(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/settings/test-slack`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ webhookUrl: settings.notifications.slackWebhookUrl }),
      });

      if (response.ok) {
        alert('✅ Slack 테스트 메시지가 전송되었습니다.');
      } else {
        const error = await response.json();
        alert(`❌ Slack 메시지 전송 실패: ${error.message || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('Failed to test Slack webhook:', error);
      alert('Slack 웹훅 테스트 중 오류가 발생했습니다.');
    } finally {
      setTestingSlack(false);
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
                시스템 알림 및 Slack 연동 설정을 관리합니다
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

              {/* Slack 연동 설정 */}
              <div className="border-t pt-6 mt-6">
                <h4 className="font-medium text-gray-900 mb-4">Slack 웹훅 연동</h4>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium text-gray-700">Slack 알림 활성화</p>
                    <p className="text-sm text-gray-500">예약 신청 시 Slack으로 알림</p>
                  </div>
                  {renderToggle(
                    settings.notifications.slackEnabled,
                    (value) => updateNotificationSetting('slackEnabled', value)
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Slack 웹훅 URL
                    </label>
                    <Input
                      type="text"
                      placeholder="https://hooks.slack.com/services/..."
                      value={settings.notifications.slackWebhookUrl}
                      onChange={(e) => updateNotificationSetting('slackWebhookUrl', e.target.value)}
                      className="w-full font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Slack Incoming Webhook URL을 입력하세요
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleTestSlackWebhook}
                    disabled={testingSlack || !settings.notifications.slackWebhookUrl}
                    className="w-full"
                  >
                    {testingSlack ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        테스트 중...
                      </>
                    ) : (
                      <>
                        <Bell className="w-4 h-4 mr-2" />
                        Slack 연동 테스트
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}