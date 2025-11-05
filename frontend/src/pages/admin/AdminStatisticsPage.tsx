import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  ArrowLeft,
  Users,
  Calendar,
  MapPin,
  TrendingUp,
  TrendingDown,
  Clock,
  Activity,
  Download,
  Filter,
  RefreshCw,
  PieChart,
  BarChart,
  LineChart,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface StatisticsData {
  overview: {
    totalUsers: number;
    totalRooms: number;
    totalReservations: number;
    activeReservations: number;
    userGrowth: number;
    reservationGrowth: number;
  };
  reservationStats: {
    byStatus: {
      confirmed: number;
      cancelled: number;
      completed: number;
    };
    byMonth: Array<{
      month: string;
      count: number;
      growth: number;
    }>;
    byRoom: Array<{
      roomName: string;
      count: number;
      utilization: number;
    }>;
    byHour: Array<{
      hour: number;
      count: number;
    }>;
  };
  userStats: {
    activeUsers: number;
    newUsersThisMonth: number;
    topUsers: Array<{
      login: string;
      displayName: string;
      reservationCount: number;
    }>;
    registrationTrend: Array<{
      month: string;
      count: number;
    }>;
  };
  systemStats: {
    averageSessionDuration: number;
    peakUsageHour: number;
    systemUptime: number;
    errorRate: number;
  };
}

export function AdminStatisticsPage() {
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  useEffect(() => {
    fetchStatistics();
  }, [selectedPeriod]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/admin/statistics?period=${selectedPeriod}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
      alert('통계 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    try {
      const response = await fetch('http://localhost:3001/admin/statistics/export', {
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
        a.download = `statistics_report_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  const getGrowthBadge = (growth: number) => {
    if (growth > 0) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <TrendingUp className="w-3 h-3 mr-1" />
          +{growth}%
        </Badge>
      );
    } else if (growth < 0) {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          <TrendingDown className="w-3 h-3 mr-1" />
          {growth}%
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline">
          0%
        </Badge>
      );
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatUptime = (uptime: number) => {
    const days = Math.floor(uptime);
    const hours = Math.floor((uptime - days) * 24);
    return `${days}일 ${hours}시간`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <RefreshCw className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">통계 데이터를 불러오는 중...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">통계 데이터를 불러올 수 없습니다.</p>
          </div>
        </main>
      </div>
    );
  }

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
                <BarChart3 className="w-8 h-8 text-orange-600 mr-3" />
                <h1 className="text-3xl font-bold text-gray-900">통계 대시보드</h1>
              </div>
              <p className="text-gray-600">시스템 이용 통계 및 분석 리포트</p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="p-2 border border-gray-300 rounded-md"
              >
                <option value="7d">최근 7일</option>
                <option value="30d">최근 30일</option>
                <option value="90d">최근 3개월</option>
                <option value="1y">최근 1년</option>
              </select>
              <Button onClick={handleExportReport}>
                <Download className="h-4 w-4 mr-2" />
                리포트 내보내기
              </Button>
            </div>
          </div>
        </div>

        {/* 전체 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">총 사용자</p>
                  <p className="text-2xl font-bold mt-1">{statistics.overview.totalUsers || 0}</p>
                </div>
                <div className="flex flex-col items-end">
                  <Users className="w-8 h-8 text-blue-500 mb-2" />
                  {getGrowthBadge(statistics.overview.userGrowth || 0)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">총 회의실</p>
                  <p className="text-2xl font-bold mt-1">{statistics.overview.totalRooms || 0}</p>
                </div>
                <MapPin className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">총 예약</p>
                  <p className="text-2xl font-bold mt-1">{statistics.overview.totalReservations || 0}</p>
                </div>
                <div className="flex flex-col items-end">
                  <Calendar className="w-8 h-8 text-purple-500 mb-2" />
                  {getGrowthBadge(statistics.overview.reservationGrowth || 0)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">활성 예약</p>
                  <p className="text-2xl font-bold mt-1">{statistics.overview.activeReservations || 0}</p>
                </div>
                <Activity className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 예약 상태별 통계 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="w-5 h-5 mr-2" />
                예약 상태별 통계
              </CardTitle>
              <CardDescription>현재 예약 상태 분포</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getStatusIcon('confirmed')}
                    <span className="ml-2 font-medium">확정</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-bold mr-2">{statistics.reservationStats.byStatus.confirmed || 0}</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${((statistics.reservationStats.byStatus.confirmed || 0) /
                            Math.max(1, (statistics.reservationStats.byStatus.confirmed || 0) +
                             (statistics.reservationStats.byStatus.cancelled || 0) +
                             (statistics.reservationStats.byStatus.completed || 0))) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getStatusIcon('cancelled')}
                    <span className="ml-2 font-medium">취소</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-bold mr-2">{statistics.reservationStats.byStatus.cancelled || 0}</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full"
                        style={{
                          width: `${((statistics.reservationStats.byStatus.cancelled || 0) /
                            Math.max(1, (statistics.reservationStats.byStatus.confirmed || 0) +
                             (statistics.reservationStats.byStatus.cancelled || 0) +
                             (statistics.reservationStats.byStatus.completed || 0))) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getStatusIcon('completed')}
                    <span className="ml-2 font-medium">완료</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-bold mr-2">{statistics.reservationStats.byStatus.completed || 0}</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${((statistics.reservationStats.byStatus.completed || 0) /
                            Math.max(1, (statistics.reservationStats.byStatus.confirmed || 0) +
                             (statistics.reservationStats.byStatus.cancelled || 0) +
                             (statistics.reservationStats.byStatus.completed || 0))) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 인기 시간대 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart className="w-5 h-5 mr-2" />
                인기 시간대
              </CardTitle>
              <CardDescription>시간대별 예약 현황</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(statistics.reservationStats.byHour || []).map((hourStat) => (
                  <div key={hourStat.hour} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{hourStat.hour}:00</span>
                    <div className="flex items-center flex-1 ml-4">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                        <div
                          className="bg-orange-500 h-2 rounded-full"
                          style={{
                            width: `${(hourStat.count / Math.max(...(statistics.reservationStats.byHour || []).map(h => h.count), 1)) * 100}%`
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold w-8 text-right">{hourStat.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 월별 예약 추이 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <LineChart className="w-5 h-5 mr-2" />
              월별 예약 추이
            </CardTitle>
            <CardDescription>최근 6개월간 예약 현황 및 성장률</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">월</th>
                    <th className="text-right p-2">예약 수</th>
                    <th className="text-right p-2">성장률</th>
                    <th className="text-right p-2">추이</th>
                  </tr>
                </thead>
                <tbody>
                  {(statistics.reservationStats.byMonth || []).map((monthStat) => (
                    <tr key={monthStat.month} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{monthStat.month}</td>
                      <td className="p-2 text-right font-bold">{monthStat.count}</td>
                      <td className="p-2 text-right">{getGrowthBadge(monthStat.growth)}</td>
                      <td className="p-2 text-right">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full"
                            style={{
                              width: `${(monthStat.count / Math.max(...(statistics.reservationStats.byMonth || []).map(m => m.count), 1)) * 100}%`
                            }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 회의실 이용률 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                회의실별 이용률
              </CardTitle>
              <CardDescription>회의실별 예약 현황 및 이용률</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(statistics.reservationStats.byRoom || []).map((roomStat) => (
                  <div key={roomStat.roomName}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{roomStat.roomName}</span>
                      <span className="text-sm text-gray-600">{roomStat.utilization}%</span>
                    </div>
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${roomStat.utilization}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">{roomStat.count}회</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 활발한 사용자 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                활발한 사용자
              </CardTitle>
              <CardDescription>예약을 가장 많이 하는 사용자들</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(statistics.userStats.topUsers || []).map((user, index) => (
                  <div key={user.login} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{user.displayName || user.login}</p>
                        <p className="text-sm text-gray-500">@{user.login}</p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {user.reservationCount}회
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 시스템 상태 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              시스템 상태
            </CardTitle>
            <CardDescription>시스템 성능 및 운영 지표</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <Clock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{statistics.systemStats.averageSessionDuration || 0}분</p>
                <p className="text-sm text-gray-600">평균 세션 시간</p>
              </div>
              <div className="text-center">
                <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{statistics.systemStats.peakUsageHour || 0}시</p>
                <p className="text-sm text-gray-600">피크 시간대</p>
              </div>
              <div className="text-center">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{statistics.systemStats.systemUptime || 0}%</p>
                <p className="text-sm text-gray-600">시스템 가동률</p>
              </div>
              <div className="text-center">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{statistics.systemStats.errorRate || 0}%</p>
                <p className="text-sm text-gray-600">에러율</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}