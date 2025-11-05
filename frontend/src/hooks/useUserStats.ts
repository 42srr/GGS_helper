import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface UserStats {
  user: {
    id: number;
    email: string;
    login: string;
    displayName: string;
    firstName: string;
    lastName: string;
    imageUrl?: string;
  };
  stats: {
    level: number;
    wallet: number;
    correctionPoint: number;
    monthlyHours: number;
    cursusName: string;
    grade: string;
    blackhole?: {
      date: string;
      daysLeft: number;
      isActive: boolean;
      status: string;
      source: string;
      type: string;
    } | null;
    coalitions: Array<{
      id: number;
      name: string;
      color: string;
      score: number;
    }>;
    skills: Array<{
      id: number;
      name: string;
      level: number;
    }>;
    projectStats: {
      completed: number;
      inProgress: number;
      total: number;
    };
    recentProjects?: Array<{
      id: number;
      project: {
        id: number;
        name: string;
        slug: string;
      };
      status: string;
      marked_at: string | null;
      marked: boolean;
      retriable_at: string | null;
      created_at: string;
      updated_at: string;
      'validated?': boolean | null;
      final_mark: number | null;
    }>;
    activeProjects?: Array<{
      id: number;
      project: {
        id: number;
        name: string;
        slug: string;
      };
      status: string;
      marked_at: string | null;
      marked: boolean;
      retriable_at: string | null;
      created_at: string;
      updated_at: string;
      'validated?': boolean | null;
      final_mark: number | null;
    }>;
    dataLastUpdated?: Date;
  };
}

export function useUserStats() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchStats = async (forceRefresh = false) => {
    if (!user) return;

    try {
      console.log(`Fetching stats: ${forceRefresh ? 'API refresh (42 API call)' : 'Database load (fast)'}`);
      setLoading(true);
      setError(null);

      // forceRefresh가 true일 때만 42 API 호출, 기본은 데이터베이스 조회
      const endpoint = forceRefresh ? '/users/stats/refresh' : '/users/dashboard';
      const method = forceRefresh ? 'POST' : 'GET';

      console.log(`Making request to: ${endpoint} (${method})`);

      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`Response not ok: ${response.status} ${response.statusText}`);
        throw new Error('Failed to fetch user stats');
      }

      const data = await response.json();

      // 과제 관련 정보는 새로고침시에만 로그 출력
      if (forceRefresh) {
        console.log('📋 API Response Projects:', {
          recentProjects: data?.stats?.recentProjects?.length || 0,
          activeProjects: data?.stats?.activeProjects?.length || 0,
          source: '42 API'
        });

        if (data?.stats?.activeProjects && data.stats.activeProjects.length > 0) {
          console.log('🔄 Active Projects from API:');
          data.stats.activeProjects.forEach((project, index) => {
            console.log(`  [${index + 1}] ${project.project?.name} (${project.status})`);
          });
        } else {
          console.log('⚠️ No active projects in API response');
        }
      }

      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching user stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshStats = () => {
    fetchStats(true);
  };

  useEffect(() => {
    fetchStats();
  }, [user]);

  return {
    stats,
    loading,
    error,
    refreshStats,
    refetch: () => fetchStats(),
  };
}