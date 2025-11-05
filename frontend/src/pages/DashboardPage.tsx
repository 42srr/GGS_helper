import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { useAuth } from "../contexts/AuthContext";
import { useUserStats } from "../hooks/useUserStats";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  TrendingUp,
  Wallet,
  Star,
  Calendar,
  Target,
  Users,
  RefreshCw,
  AlertCircle
} from "lucide-react";

export function DashboardPage() {
  const { user } = useAuth();
  const { stats, loading, error, refreshStats } = useUserStats();

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">42 API에서 데이터를 가져오는 중...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">{error || '데이터를 불러올 수 없습니다.'}</p>
              <Button onClick={() => window.location.reload()}>
                다시 시도
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const { stats: userStats } = stats || {};

  // userStats가 없는 경우 처리
  if (!userStats) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">데이터를 불러오는 중...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 계산된 값들
  const targetHours = 120; // 월간 목표 시간

  // level과 monthlyHours를 숫자로 변환 (문자열일 경우 대비)
  const currentLevel = userStats.level != null ? parseFloat(userStats.level.toString()) : 0;
  const levelProgress = currentLevel > 0 ? ((currentLevel % 1) * 100) : 0;

  const monthlyHours = userStats.monthlyHours != null ? parseFloat(userStats.monthlyHours.toString()) : 0;
  const monthlyProgress = (monthlyHours / targetHours) * 100;

  // 프로젝트 데이터 확인은 새로고침시에만 로그 출력
  // (기본 로드시에는 데이터베이스에 activeProjects가 빈 배열이므로 로그 생략)

  // 최근 활동 Mock 데이터 (실제로는 42 API에서 가져와야 함)
  const recentActivity = [
    { type: "evaluation", name: "평가 완료", status: "완료", date: "오늘" },
    { type: "project", name: "최근 프로젝트", status: "진행중", date: "어제" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* 헤더 섹션 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              {stats.user.imageUrl ? (
                <img
                  src={stats.user.imageUrl}
                  alt={stats.user.displayName || stats.user.login}
                  className="w-16 h-16 rounded-full border-4 border-blue-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {(stats.user.displayName || stats.user.login).charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {stats.user.displayName || stats.user.login}
                </h1>
                <p className="text-gray-600">
                  {userStats.cursusName} • 경산 캠퍼스
                </p>
                <Badge variant="secondary" className="mt-1">
                  {userStats.grade}
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {userStats.dataLastUpdated && (
                <p className="text-sm text-gray-500">
                  마지막 업데이트: {new Date(userStats.dataLastUpdated).toLocaleString()}
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={refreshStats}
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>새로고침</span>
              </Button>
            </div>
          </div>
        </div>

        {/* 메인 통계 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* 월간 학습시간 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">월간 학습시간</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{monthlyHours.toFixed(1)}h</div>
              <div className="mt-2">
                <Progress value={Math.min(monthlyProgress, 100)} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  목표: {targetHours}h ({Math.round(monthlyProgress)}%)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 레벨 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">현재 레벨</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentLevel.toFixed(2)}</div>
              <div className="mt-2">
                <Progress value={levelProgress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  다음 레벨까지 {Math.round(100 - levelProgress)}%
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Wallet */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wallet</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₩{typeof userStats.wallet === 'number' ? userStats.wallet.toLocaleString() : '0'}</div>
              <p className="text-xs text-muted-foreground">
                사용 가능한 포인트
              </p>
            </CardContent>
          </Card>

          {/* Correction Points */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">평가 포인트</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{typeof userStats.correctionPoint === 'number' ? userStats.correctionPoint : 0}</div>
              <p className="text-xs text-muted-foreground">
                현재 보유 포인트
              </p>
            </CardContent>
          </Card>

          {/* Coalition */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Coalition</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {userStats.coalitions && userStats.coalitions.length > 0 ? (
                <div className="text-2xl font-bold">{userStats.coalitions[0].name}</div>
              ) : (
                <div className="text-2xl font-bold text-gray-400">-</div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                소속 Coalition
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 현재 진행중인 과제 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>현재 진행중인 과제</span>
            </CardTitle>
            <CardDescription>
              현재 진행중인 프로젝트 목록
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userStats.activeProjects && userStats.activeProjects.length > 0 ? (
                userStats.activeProjects
                  .slice(0, 5)
                  .map((project, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex-1">
                        <div className="font-medium text-blue-900">
                          {project.project?.name || '프로젝트명 없음'}
                        </div>
                        <div className="text-sm text-blue-700">
                          시작일: {project.created_at ? new Date(project.created_at).toLocaleDateString('ko-KR') : '날짜 없음'}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant="secondary"
                          className={
                            project.status === 'in_progress'
                              ? "bg-blue-100 text-blue-800"
                              : "bg-orange-100 text-orange-800"
                          }
                        >
                          {project.status === 'in_progress' ? '진행중' : '평가대기'}
                        </Badge>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  현재 진행중인 과제가 없습니다.
                </div>
              )}

              {/* 진행중인 과제 수 요약 */}
              <div className="pt-2 border-t border-gray-200">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">진행중인 과제</span>
                    <span className="font-semibold text-blue-600">
                      {userStats.activeProjects?.filter(project =>
                        project.status === 'in_progress'
                      ).length || 0}개
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">평가 대기중</span>
                    <span className="font-semibold text-orange-600">
                      {userStats.activeProjects?.filter(project =>
                        project.status === 'waiting_for_correction'
                      ).length || 0}개
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-medium pt-1 border-t border-gray-100">
                    <span className="text-gray-700">총 활성 과제</span>
                    <span className="text-purple-600">
                      {userStats.activeProjects?.length || 0}개
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}