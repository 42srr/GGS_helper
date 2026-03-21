import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Database,
  Download,
  Upload,
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  FileArchive,
  HardDrive,
  RefreshCw,
  Calendar,
  FileText,
  Trash2,
  Settings,
  Save
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface BackupItem {
  id: string;
  name: string;
  type: 'auto' | 'manual';
  size: string;
  createdAt: string;
  status: 'completed' | 'failed' | 'in_progress';
  description: string;
}

export function AdminBackupPage() {
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [totalSize, setTotalSize] = useState('0 MB');
  const [lastBackupTime, setLastBackupTime] = useState('없음');
  const [backupSchedule, setBackupSchedule] = useState({
    enabled: false,
    schedule: '매일 새벽 2시',
    retentionDays: 30,
    nextBackup: '없음',
    backupHour: 2,
  });
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    enabled: false,
    retentionDays: 30,
    backupHour: 2,
  });
  const [savingSchedule, setSavingSchedule] = useState(false);

  useEffect(() => {
    fetchBackups();
    fetchBackupSchedule();
  }, []);

  const fetchBackups = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/backup/list`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setBackups(data.backups || []);
        setTotalSize(data.totalSize || '0 MB');
        setLastBackupTime(data.lastBackup || '없음');
      }
    } catch (error) {

    }
  };

  const fetchBackupSchedule = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/backup/schedule`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setBackupSchedule(data);
        setScheduleForm({
          enabled: data.enabled,
          retentionDays: data.retentionDays,
          backupHour: data.backupHour || 2,
        });
      }
    } catch (error) {

    }
  };

  const handleEditSchedule = () => {
    setScheduleForm({
      enabled: backupSchedule.enabled,
      retentionDays: backupSchedule.retentionDays,
      backupHour: backupSchedule.backupHour,
    });
    setIsEditingSchedule(true);
  };

  const handleCancelEdit = () => {
    setIsEditingSchedule(false);
    setScheduleForm({
      enabled: backupSchedule.enabled,
      retentionDays: backupSchedule.retentionDays,
      backupHour: backupSchedule.backupHour,
    });
  };

  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/backup/schedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(scheduleForm),
      });

      if (response.ok) {
        alert('✅ 백업 스케줄이 업데이트되었습니다.');
        await fetchBackupSchedule();
        setIsEditingSchedule(false);
      } else {
        alert('❌ 백업 스케줄 업데이트에 실패했습니다.');
      }
    } catch (error) {

      alert('❌ 백업 스케줄 업데이트 중 오류가 발생했습니다.');
    } finally {
      setSavingSchedule(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            완료
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            실패
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            진행중
          </Badge>
        );
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    return type === 'auto' ? (
      <Badge variant="outline" className="text-blue-600">
        <Clock className="w-3 h-3 mr-1" />
        자동
      </Badge>
    ) : (
      <Badge variant="outline" className="text-purple-600">
        <FileText className="w-3 h-3 mr-1" />
        수동
      </Badge>
    );
  };

  const handleCreateBackup = async () => {
    if (!confirm('수동 백업을 생성하시겠습니까?')) return;

    setLoading(true);
    setBackupProgress(0);

    // 진행상황 시뮬레이션
    const interval = setInterval(() => {
      setBackupProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 5;
      });
    }, 200);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/backup/create`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        clearInterval(interval);
        setBackupProgress(100);

        alert(`✅ 백업이 생성되었습니다.\nID: ${result.backupId}`);

        // 백업 목록 새로고침
        await fetchBackups();
        setBackupProgress(0);
      } else {
        clearInterval(interval);
        alert('❌ 백업 생성에 실패했습니다.');
      }
    } catch (error) {

      clearInterval(interval);
      alert('❌ 백업 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      setBackupProgress(0);
    }
  };

  const handleDownloadBackup = async (backupId: string, backupName: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/backup/download/${backupId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${backupName}.sql`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {

    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (!confirm('이 백업을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/backup/${backupId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        alert('✅ 백업이 삭제되었습니다.');
        await fetchBackups();
      } else {
        alert('❌ 백업 삭제에 실패했습니다.');
      }
    } catch (error) {

      alert('❌ 백업 삭제 중 오류가 발생했습니다.');
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    if (dateStr === '없음') return '없음';
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return '방금 전';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    return `${Math.floor(diffInSeconds / 86400)}일 전`;
  };

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
    }
  ];

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
                <Database className="w-8 h-8 text-indigo-600 mr-3" />
                <h1 className="text-3xl font-bold text-gray-900">데이터 백업</h1>
              </div>
              <p className="text-gray-600">시스템 데이터를 안전하게 백업하고 관리합니다</p>
            </div>
            <Button onClick={handleCreateBackup} disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  백업 생성중... ({backupProgress}%)
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  수동 백업 생성
                </>
              )}
            </Button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <Icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 백업 설정 카드 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    백업 스케줄
                  </CardTitle>
                  <CardDescription>
                    자동 백업 스케줄 및 보관 정책
                  </CardDescription>
                </div>
                {!isEditingSchedule && (
                  <Button variant="outline" size="sm" onClick={handleEditSchedule}>
                    <Settings className="w-4 h-4 mr-2" />
                    설정
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditingSchedule ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">자동 백업 활성화</p>
                      <p className="text-sm text-gray-500">매일 지정한 시간에 자동 백업</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={scheduleForm.enabled}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, enabled: e.target.checked }))}
                      />
                      <div className={`w-11 h-6 bg-gray-200 rounded-full peer ${scheduleForm.enabled ? 'peer-checked:bg-blue-600' : ''}`}>
                        <div className={`absolute top-[2px] left-[2px] bg-white border border-gray-300 rounded-full h-5 w-5 transition-transform ${scheduleForm.enabled ? 'translate-x-5' : ''}`}></div>
                      </div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      백업 시간
                    </label>
                    <select
                      value={scheduleForm.backupHour}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, backupHour: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = i;
                        const period = hour < 12 ? '오전' : '오후';
                        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                        return (
                          <option key={hour} value={hour}>
                            {period} {displayHour}시
                          </option>
                        );
                      })}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      매일 지정한 시간에 자동 백업이 실행됩니다
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      백업 보관 기간 (일)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      value={scheduleForm.retentionDays}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, retentionDays: parseInt(e.target.value) || 30 }))}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      설정한 기간보다 오래된 백업은 자동 삭제됩니다
                    </p>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button onClick={handleSaveSchedule} disabled={savingSchedule} className="flex-1">
                      {savingSchedule ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          저장 중...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          저장
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={handleCancelEdit} disabled={savingSchedule} className="flex-1">
                      취소
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
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
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="w-5 h-5 mr-2" />
                백업 정보
              </CardTitle>
              <CardDescription>
                백업 파일 저장 위치 및 용량 정보
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">저장 위치</p>
                  <p className="text-sm text-gray-500 font-mono">/backups</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">총 백업 크기</p>
                  <p className="text-sm text-gray-500">{totalSize}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">백업 파일 수</p>
                  <p className="text-sm text-gray-500">{backups.length}개</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 백업 목록 */}
        <Card>
          <CardHeader>
            <CardTitle>백업 기록</CardTitle>
            <CardDescription>생성된 백업 파일 목록 및 관리</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-4 font-medium">백업명</th>
                    <th className="text-left p-4 font-medium">유형</th>
                    <th className="text-left p-4 font-medium">크기</th>
                    <th className="text-left p-4 font-medium">생성일시</th>
                    <th className="text-left p-4 font-medium">상태</th>
                    <th className="text-left p-4 font-medium">설명</th>
                    <th className="text-left p-4 font-medium">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((backup) => (
                    <tr key={backup.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">
                        <div className="flex items-center">
                          <FileArchive className="h-4 w-4 mr-2 text-gray-400" />
                          {backup.name}
                        </div>
                      </td>
                      <td className="p-4">{getTypeBadge(backup.type)}</td>
                      <td className="p-4">{backup.size}</td>
                      <td className="p-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                          {formatDate(backup.createdAt)}
                        </div>
                      </td>
                      <td className="p-4">{getStatusBadge(backup.status)}</td>
                      <td className="p-4 text-sm text-gray-600">{backup.description}</td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadBackup(backup.id, backup.name)}
                            disabled={backup.status !== 'completed'}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteBackup(backup.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {backups.length === 0 && (
              <div className="text-center py-12">
                <Database className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 text-lg">생성된 백업이 없습니다.</p>
                <p className="text-gray-400 text-sm mt-2">
                  수동 백업을 생성하거나 자동 백업을 기다려주세요.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 복원 가이드 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              백업 복원 가이드
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                <li>시스템 점검 시간에 복원 작업을 수행해주세요.</li>
                <li>복원 전 현재 데이터의 백업을 생성하는 것을 권장합니다.</li>
                <li>백업 파일을 다운로드하여 데이터베이스에 복원하세요.</li>
                <li>복원 후 시스템 정상 작동을 확인해주세요.</li>
                <li>문제 발생 시 즉시 시스템 관리자에게 연락하세요.</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}