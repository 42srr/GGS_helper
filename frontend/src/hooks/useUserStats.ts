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

      setLoading(true);
      setError(null);

      // forceRefresh가 true일 때만 42 API 호출, 기본은 데이터베이스 조회
      const endpoint = forceRefresh ? '/users/stats/refresh' : '/users/dashboard';
      const method = forceRefresh ? 'POST' : 'GET';

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {

        throw new Error('Failed to fetch user stats');
      }

      const data = await response.json();

      // 과제 관련 정보는 새로고침시에만 로그 출력
      if (forceRefresh) {

        if (data?.stats?.activeProjects && data.stats.activeProjects.length > 0) {

          data.stats.activeProjects.forEach((_project: any, _index: number) => {

          });
        } else {

        }
      }

      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');

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