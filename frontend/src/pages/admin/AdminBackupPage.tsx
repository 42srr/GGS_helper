import { useState } from 'react';
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
  Shield
} from 'lucide-react';

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
  const [backups, setBackups] = useState<BackupItem[]>([
    {
      id: '1',
      name: 'daily_backup_20240924',
      type: 'auto',
      size: '245.3 MB',
      createdAt: '2024-09-24T03:00:00Z',
      status: 'completed',
      description: '일일 자동 백업 - 전체 데이터베이스'
    },
    {
      id: '2',
      name: 'manual_backup_20240923',
      type: 'manual',
      size: '238.7 MB',
      createdAt: '2024-09-23T15:30:00Z',
      status: 'completed',
      description: '수동 백업 - 관리자 요청'
    },
    {
      id: '3',
      name: 'weekly_backup_20240922',
      type: 'auto',
      size: '512.1 MB',
      createdAt: '2024-09-22T02:00:00Z',
      status: 'completed',
      description: '주간 백업 - 전체 시스템 + 파일'
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);

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
    setLoading(true);
    setBackupProgress(0);

    try {
      const response = await fetch('http://localhost:3001/admin/backup/create', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        // 진행상황 시뮬레이션
        const interval = setInterval(() => {
          setBackupProgress(prev => {
            if (prev >= 100) {
              clearInterval(interval);
              return 100;
            }
            return prev + 10;
          });
        }, 300);

        setTimeout(() => {
          const newBackup: BackupItem = {
            id: Date.now().toString(),
            name: `manual_backup_${new Date().toISOString().split('T')[0]}`,
            type: 'manual',
            size: '0 MB',
            createdAt: new Date().toISOString(),
            status: 'in_progress',
            description: '수동 백업 생성중...'
          };

          setBackups(prev => [newBackup, ...prev]);

          setTimeout(() => {
            setBackups(prev => prev.map(backup =>
              backup.id === newBackup.id
                ? { ...backup, status: 'completed', size: '251.8 MB', description: '수동 백업 완료' }
                : backup
            ));
            setBackupProgress(0);
            setLoading(false);
          }, 2000);
        }, 3000);
      }
    } catch (error) {
      console.error('백업 생성 실패:', error);
      setLoading(false);
      setBackupProgress(0);
    }
  };

  const handleDownloadBackup = async (backupId: string, backupName: string) => {
    try {
      const response = await fetch(`http://localhost:3001/admin/backup/download/${backupId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
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
      console.error('백업 다운로드 실패:', error);
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (!confirm('이 백업을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`http://localhost:3001/admin/backup/${backupId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        setBackups(prev => prev.filter(backup => backup.id !== backupId));
      }
    } catch (error) {
      console.error('백업 삭제 실패:', error);
    }
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
      value: '996.1 MB',
      icon: HardDrive,
      color: 'text-green-600'
    },
    {
      label: '마지막 백업',
      value: '3시간 전',
      icon: Clock,
      color: 'text-purple-600'
    },
    {
      label: '자동 백업',
      value: '활성화',
      icon: RefreshCw,
      color: 'text-orange-600'
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
              <CardTitle className="flex items-center">
                <RefreshCw className="w-5 h-5 mr-2" />
                자동 백업 설정
              </CardTitle>
              <CardDescription>
                정기적인 자동 백업 스케줄을 관리합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">일일 백업</p>
                    <p className="text-sm text-gray-600">매일 오전 3시에 실행</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">활성화</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">주간 백업</p>
                    <p className="text-sm text-gray-600">매주 일요일 오전 2시에 실행</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">활성화</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">월간 백업</p>
                    <p className="text-sm text-gray-600">매월 1일 오전 1시에 실행</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">활성화</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                백업 보안 설정
              </CardTitle>
              <CardDescription>
                백업 데이터의 보안과 보관 정책을 관리합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">암호화</p>
                    <p className="text-sm text-gray-600">AES-256 암호화 적용</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">적용됨</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">보관 기간</p>
                    <p className="text-sm text-gray-600">자동 백업 30일 보관</p>
                  </div>
                  <Badge variant="outline">30일</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">원격 저장소</p>
                    <p className="text-sm text-gray-600">클라우드 백업 동기화</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">연결됨</Badge>
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
                            <AlertCircle className="h-4 w-4" />
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