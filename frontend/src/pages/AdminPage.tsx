import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Settings,
  Users,
  MapPin,
  Calendar,
  BarChart3,
  Shield,
  Database,
  FileText,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

// 상대적 시간 표시 함수
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return '방금 전';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}분 전`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}시간 전`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}일 전`;
  }
}

export function AdminPage() {
  const location = useLocation();
  const isAdminRoot = location.pathname === '/admin';
  const [stats, setStats] = useState({
    totalRooms: 0,
    todayReservations: 0,
    totalUsers: 0,
    totalReservations: 0,
    userGrowth: 0,
    reservationGrowth: 0
  });
  const [loading, setLoading] = useState(false);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    if (isAdminRoot) {
      fetchSystemStats();
      fetchStatistics();
      fetchRecentActivities();
    }
  }, [isAdminRoot]);

  const fetchSystemStats = async () => {
    try {
      console.log('Fetching system stats...');
      const token = localStorage.getItem('accessToken');
      console.log('Access token:', token ? 'Found' : 'Not found');

      const response = await fetch('http://localhost:3001/admin/system/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      console.log('System stats response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('System stats data:', data);
        setStats(prev => ({
          ...prev,
          totalRooms: data.totalRooms,
          todayReservations: data.todayReservations,
          totalUsers: data.totalUsers,
          totalReservations: data.totalReservations
        }));
      } else {
        const errorData = await response.text();
        console.error('System stats error:', errorData);
      }
    } catch (error) {
      console.error('Failed to fetch system stats:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      console.log('Fetching statistics...');
      const token = localStorage.getItem('accessToken');

      const response = await fetch('http://localhost:3001/admin/statistics?period=30d', {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      console.log('Statistics response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Statistics data:', data);
        setStats(prev => ({
          ...prev,
          userGrowth: data.overview?.userGrowth || 0,
          reservationGrowth: data.overview?.reservationGrowth || 0
        }));
      } else {
        const errorData = await response.text();
        console.error('Statistics error:', errorData);
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      console.log('Fetching recent activities...');
      const token = localStorage.getItem('accessToken');

      const response = await fetch('http://localhost:3001/admin/activities/recent?limit=5', {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      console.log('Activities response status:', response.status);

      if (response.ok) {
        const activities = await response.json();
        console.log('Activities data:', activities);
        setRecentActivities(activities);
      } else {
        const errorData = await response.text();
        console.error('Activities error:', errorData);

        // 샘플 데이터 생성 시도
        if (response.status === 401) {
          console.log('Unauthorized - trying to create sample data...');
          await createSampleActivities();
        }
      }
    } catch (error) {
      console.error('Failed to fetch recent activities:', error);
    }
  };

  const createSampleActivities = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:3001/admin/activities/create-samples', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('Sample activities created');
        // 샘플 데이터 생성 후 다시 활동 로그 가져오기
        fetchRecentActivities();
      }
    } catch (error) {
      console.error('Failed to create sample activities:', error);
    }
  };

  const handleQuickAction = async (action: string) => {
    setLoading(true);
    try {
      switch (action) {
        case 'backup':
          const backupResponse = await fetch('http://localhost:3001/admin/backup/create', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
              'Content-Type': 'application/json'
            }
          });
          if (backupResponse.ok) {
            alert('백업이 생성되었습니다.');
          }
          break;
        case 'clear-logs':
          const logsResponse = await fetch('http://localhost:3001/admin/system/clear-logs', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
              'Content-Type': 'application/json'
            }
          });
          if (logsResponse.ok) {
            alert('로그가 삭제되었습니다.');
          }
          break;
        case 'export-stats':
          const exportResponse = await fetch('http://localhost:3001/admin/statistics/export', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
          });
          if (exportResponse.ok) {
            const blob = await exportResponse.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `statistics_${new Date().toISOString().split('T')[0]}.xlsx`;
            a.click();
          }
          break;
      }
    } catch (error) {
      console.error('Failed to execute action:', error);
      alert('작업 실행에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const adminMenuItems = [
    {
      title: '회의실 관리',
      description: '회의실 추가, 수정, 삭제 및 Excel 관리',
      icon: MapPin,
      link: '/admin/rooms',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: '사용자 관리',
      description: '사용자 권한 관리 및 활동 모니터링',
      icon: Users,
      link: '/admin/users',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: '예약 관리',
      description: '전체 예약 현황 조회 및 관리',
      icon: Calendar,
      link: '/admin/reservations',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: '통계 대시보드',
      description: '이용 통계 및 분석 리포트',
      icon: BarChart3,
      link: '/admin/statistics',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: '시스템 설정',
      description: '시스템 환경 설정 및 정책 관리',
      icon: Settings,
      link: '/admin/settings',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    },
    {
      title: '데이터 백업',
      description: '데이터 백업 및 복원 관리',
      icon: Database,
      link: '/admin/backup',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ];

  const statsCards = [
    {
      label: '전체 회의실',
      value: stats.totalRooms.toString(),
      change: stats.totalRooms > 10 ? '+2' : '+0'
    },
    {
      label: '오늘 예약',
      value: stats.todayReservations.toString(),
      change: stats.todayReservations > 20 ? '+5' : '+0'
    },
    {
      label: '활성 사용자',
      value: stats.totalUsers.toString(),
      change: stats.userGrowth ? `+${stats.userGrowth.toFixed(1)}%` : '+0%'
    },
    {
      label: '전체 예약',
      value: stats.totalReservations.toString(),
      change: stats.reservationGrowth ? `+${stats.reservationGrowth.toFixed(1)}%` : '+0%'
    }
  ];

  if (!isAdminRoot) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* 관리자 헤더 */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Shield className="w-8 h-8 text-red-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
          </div>
          <p className="text-gray-600">
            시스템 전체 관리 및 모니터링을 수행할 수 있습니다.
          </p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statsCards.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <span className="text-green-600 text-sm font-medium">
                    {stat.change}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 관리 메뉴 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.link} to={item.link}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-lg ${item.bgColor}`}>
                        <Icon className={`w-6 h-6 ${item.color}`} />
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-lg mb-2">{item.title}</CardTitle>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* 빠른 작업 */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                빠른 작업
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  fetchSystemStats();
                  fetchStatistics();
                  fetchRecentActivities();
                }}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                새로고침
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => handleQuickAction('backup')}
                disabled={loading}
              >
                <Database className="w-4 h-4 mr-2" />
                백업 생성
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => handleQuickAction('clear-logs')}
                disabled={loading}
              >
                <FileText className="w-4 h-4 mr-2" />
                로그 정리
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => handleQuickAction('export-stats')}
                disabled={loading}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                통계 내보내기
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 최근 활동 로그 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>최근 시스템 활동</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivities.length > 0 ? (
              <div className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <div key={activity.id || index} className={`flex items-center justify-between py-2 ${index < recentActivities.length - 1 ? 'border-b' : ''}`}>
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-3 ${
                        activity.level === 'success' ? 'bg-green-500' :
                        activity.level === 'info' ? 'bg-blue-500' :
                        activity.level === 'warning' ? 'bg-yellow-500' :
                        activity.level === 'error' ? 'bg-red-500' :
                        'bg-gray-500'
                      }`}></div>
                      <div>
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-gray-500">{activity.description}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatRelativeTime(new Date(activity.createdAt))}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>최근 활동이 없습니다.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={createSampleActivities}
                  className="mt-2"
                >
                  샘플 데이터 생성
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}