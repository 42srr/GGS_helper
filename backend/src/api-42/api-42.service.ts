import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { Api42ConfigService } from './api-42-config.service';

export interface FortyTwoUser {
  id: number;
  email: string;
  login: string;
  first_name: string;
  last_name: string;
  usual_full_name: string;
  displayname: string;
  kind: string;
  image: {
    link: string;
    versions: {
      large: string;
      medium: string;
      small: string;
      micro: string;
    };
  };
  'staff?': boolean;
  correction_point: number;
  pool_month: string;
  pool_year: string;
  location: string | null;
  wallet: number;
  anonymize_date: string;
  data_erasure_date: string | null;
  created_at: string;
  updated_at: string;
  alumnized_at: string | null;
  'alumni?': boolean;
  'active?': boolean;
}

export interface CursusUser {
  id: number;
  begin_at: string;
  end_at: string | null;
  grade: string | null;
  level: number;
  skills: Array<{
    id: number;
    name: string;
    level: number;
  }>;
  blackholed_at: string | null;
  cursus_id: number;
  cursus: {
    id: number;
    name: string;
    slug: string;
    kind: string;
  };
}

export interface LocationStats {
  begin_at: string;
  end_at: string | null;
  host: string;
  primary_campus_id: number;
  secondary_campus_id?: number;
  has_coalition: boolean;
  created_at: string;
  updated_at: string;
  user: FortyTwoUser;
  cursus: {
    id: number;
    created_at: string;
    name: string;
    slug: string;
    kind: string;
  };
}

export interface ProjectUser {
  id: number;
  occurrence: number;
  final_mark: number | null;
  status: string;
  'validated?': boolean | null;
  current_team_id: number;
  project: {
    id: number;
    name: string;
    slug: string;
    difficulty: number;
    description: string;
    parent: any;
  };
  cursus_ids: number[];
  marked_at: string | null;
  marked: boolean;
  retriable_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Coalition {
  id: number;
  name: string;
  slug: string;
  image_url: string;
  cover_url: string;
  color: string;
  score: number;
  user_id: number;
}

export interface LocationStats {
  id: number;
  begin_at: string;
  end_at: string | null;
  primary: boolean;
  host: string;
  campus_id: number;
  user_id: number;
}

export interface Milestone {
  id: number;
  name: string;
  description: string;
  due_at: string;
  begin_at: string;
  end_at: string | null;
  project_id: number;
  cursus_id: number;
  campus_id: number;
}

@Injectable()
export class Api42Service {
  private axiosInstance: AxiosInstance;
  private readonly API_BASE_URL = 'https://api.intra.42.fr/v2';
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(
    private configService: ConfigService,
    private api42ConfigService: Api42ConfigService,
  ) {
    // 동적 설정 서비스에서 키 가져오기
    this.clientId = this.api42ConfigService.getClientId();
    this.clientSecret = this.api42ConfigService.getClientSecret();

    this.axiosInstance = axios.create({
      baseURL: 'https://api.intra.42.fr/v2',
      timeout: 30000, // 30초로 증가
    });
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      // console.log('Using cached access token');
      return this.accessToken;
    }

    // 동적으로 최신 키 가져오기 (예약된 키 자동 활성화 포함)
    this.clientId = this.api42ConfigService.getClientId();
    this.clientSecret = this.api42ConfigService.getClientSecret();

    // console.log('Getting new access token from 42 API');
    // console.log('Client ID:', this.clientId ? 'Present' : 'Missing');
    // console.log('Client Secret:', this.clientSecret ? 'Present' : 'Missing');

    if (!this.clientId || !this.clientSecret) {
      console.error('42 OAuth credentials not configured');
      throw new HttpException(
        '42 OAuth credentials not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      // console.log('Requesting token from 42 API...');
      const response = await axios.post('https://api.intra.42.fr/oauth/token', {
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      });

      // console.log('Token response status:', response.status);
      // console.log('Token response data keys:', Object.keys(response.data));

      this.accessToken = response.data.access_token;
      this.tokenExpiry = new Date(
        Date.now() + response.data.expires_in * 1000 - 60000,
      ); // 1분 여유

      if (!this.accessToken) {
        console.error('No access token in response');
        throw new HttpException(
          'Failed to get access token from 42 API',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // console.log(
      //   'Successfully obtained access token, expires at:',
      //   this.tokenExpiry,
      // );
      return this.accessToken;
    } catch (error) {
      console.error('Error getting 42 API access token:', error.message);
      if (axios.isAxiosError(error)) {
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
      }
      throw new HttpException(
        'Failed to get 42 API access token',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async makeRequest<T>(url: string, retryCount = 0): Promise<T> {
    // console.log('Making request to 42 API:', url);
    const token = await this.getAccessToken();

    try {
      // console.log('Sending request with token:', token ? 'Present' : 'Missing');
      const response = await this.axiosInstance.get<T>(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // console.log('API request successful, status:', response.status);
      return response.data;
    } catch (error) {
      console.error('API request failed for URL:', url);
      if (axios.isAxiosError(error)) {
        console.error('Axios error status:', error.response?.status);
        console.error('Axios error data:', error.response?.data);

        if (error.response?.status === 429 && retryCount < 3) {
          // Rate limit 에러인 경우 재시도 (최대 3회)
          const waitTime = Math.pow(2, retryCount) * 1000; // 지수 백오프: 1초, 2초, 4초
          console.log(
            `Rate limited, waiting ${waitTime}ms before retry ${retryCount + 1}/3...`,
          );
          await this.delay(waitTime);
          return this.makeRequest<T>(url, retryCount + 1);
        }

        if (error.response?.status === 401) {
          // console.log('Token expired, getting new token and retrying...');
          // Token이 만료된 경우 재시도
          this.accessToken = null;
          this.tokenExpiry = null;
          const newToken = await this.getAccessToken();

          // console.log('Retrying with new token...');
          const retryResponse = await this.axiosInstance.get<T>(url, {
            headers: {
              Authorization: `Bearer ${newToken}`,
            },
          });
          // console.log('Retry successful, status:', retryResponse.status);
          return retryResponse.data;
        }
        throw new HttpException(
          `42 API request failed: ${error.message}`,
          error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      console.error('Non-axios error:', error);
      throw error;
    }
  }

  async getUserById(userId: number): Promise<FortyTwoUser> {
    return this.makeRequest<FortyTwoUser>(`/users/${userId}`);
  }

  async getCurrentUserInfo(accessToken: string): Promise<any> {
    // console.log('Making request to /v2/me with user token');
    try {
      const response = await this.axiosInstance.get('/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      // console.log('Current user data received from /me endpoint');
      // console.log('Data keys:', Object.keys(response.data));
      return response.data;
    } catch (error) {
      console.error(
        'Failed to fetch current user data from /me endpoint:',
        error,
      );
      if (axios.isAxiosError(error)) {
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
      }
      throw error;
    }
  }

  async getUserByLogin(login: string): Promise<FortyTwoUser> {
    return this.makeRequest<FortyTwoUser>(`/users/${login}`);
  }

  async getUserCursus(userId: number): Promise<CursusUser[]> {
    return this.makeRequest<CursusUser[]>(`/users/${userId}/cursus_users`);
  }

  async getUserProjects(userId: number): Promise<ProjectUser[]> {
    const projects = await this.makeRequest<ProjectUser[]>(
      `/users/${userId}/projects_users`,
    );
    return projects;
  }

  async getUserCoalitions(userId: number): Promise<Coalition[]> {
    return this.makeRequest<Coalition[]>(`/users/${userId}/coalitions`);
  }

  async getUserLocations(userId: number): Promise<LocationStats[]> {
    const now = new Date();
    const oneMonthAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      now.getDate(),
    );

    const url = `/users/${userId}/locations?range[begin_at]=${oneMonthAgo.toISOString()},${now.toISOString()}`;
    return this.makeRequest<LocationStats[]>(url);
  }

  // 디버그용 함수 - 필요시 주석 해제하여 사용
  // async analyzeUserDetailAPI(userId: number | string): Promise<any> {
  //   console.log(`=== 분석: GET /v2/users/${userId} API ===`);
  //   try {
  //     const userDetail = await this.makeRequest<any>(`/users/${userId}`);
  //     // ... 분석 로직
  //     return userDetail;
  //   } catch (error) {
  //     console.error('Failed to analyze user detail API:', error);
  //     return null;
  //   }
  // }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getUserStats(userId: number) {
    try {
      // 42 API Rate Limit: 초당 3회 제한이므로 순차적으로 호출하고 각 호출 사이에 400ms 지연
      const user = await this.getUserById(userId);
      await this.delay(400);

      const cursusUsers = await this.getUserCursus(userId);
      await this.delay(400);

      const projects = await this.getUserProjects(userId);
      await this.delay(400);

      const coalitions = await this.getUserCoalitions(userId);
      await this.delay(400);

      const locations = await this.getUserLocations(userId);
      await this.delay(400);

      // 디버그용 분석 함수 주석 처리
      // const userDetailAnalysis = await this.analyzeUserDetailAPI(userId);

      // 데드라인 정보 확인을 위한 상세 로그 (개발 시 필요하면 주석 해제)
      // if (cursusUsers && cursusUsers.length > 0) {
      //   console.log(
      //     'Sample cursus user data keys:',
      //     Object.keys(cursusUsers[0]),
      //   );
      //   console.log(
      //     'Sample cursus user data:',
      //     JSON.stringify(cursusUsers[0], null, 2),
      //   );
      // }

      if (projects && projects.length > 0) {
        // console.log('Sample project data keys:', Object.keys(projects[0]));
        // console.log('Sample project data:', JSON.stringify(projects[0], null, 2));
      }

      // 현재 활성 cursus 찾기 (보통 42cursus)
      const activeCursus =
        cursusUsers.find(
          (cu) => cu.cursus.name === '42cursus' || cu.end_at === null,
        ) || cursusUsers[0];
      // console.log('Active cursus found:', activeCursus?.cursus?.name || 'None');

      // 데드라인 정보 계산 (블랙홀 + 마일스톤)
      console.log('=== 데드라인 정보 분석 ===');

      // 1. 블랙홀 정보 확인
      const blackholedAt = activeCursus?.blackholed_at;
      console.log('Raw blackholed_at from cursus:', blackholedAt);

      // 2. 사용자 상세 API 분석 완료
      console.log('User detail API analysis completed');

      // 3. 가장 가까운 데드라인 찾기
      const nearestDeadline: string | null = null;
      const deadlineSource = '';

      const now = new Date();
      const deadlines: Array<{ date: string; source: string; type: string }> =
        [];

      // 블랙홀 데이터 추가
      if (blackholedAt) {
        deadlines.push({
          date: blackholedAt,
          source: 'blackhole',
          type: 'Black Hole',
        });
      }

      // 사용자 상세 정보에서 추가 데드라인 정보 확인 (디버그용 주석 처리)
      // if (userDetailAnalysis && userDetailAnalysis.cursus_users) {
      //   userDetailAnalysis.cursus_users.forEach((cu, index) => {
      //     if (cu.blackholed_at) {
      //       deadlines.push({
      //         date: cu.blackholed_at,
      //         source: 'user_detail',
      //         type: `${cu.cursus?.name || 'Unknown'} Black Hole`,
      //       });
      //       console.log(
      //         `추가된 데드라인 (${index + 1}):`,
      //         cu.blackholed_at,
      //         'from',
      //         cu.cursus?.name,
      //       );
      //     }
      //   });
      // }

      // 미래 데드라인 중 가장 가까운 것 찾기
      const futureDeadlines = deadlines
        .filter((deadline) => new Date(deadline.date) > now)
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );

      console.log('All deadlines:', deadlines);
      console.log('Future deadlines:', futureDeadlines);

      let blackholeInfo: {
        date: string;
        daysLeft: number;
        isActive: boolean;
        status: string;
        source: string;
        type: string;
      } | null = null;

      if (futureDeadlines.length > 0) {
        const nextDeadline = futureDeadlines[0];
        const deadlineDate = new Date(nextDeadline.date);

        console.log('Next deadline:', nextDeadline);
        console.log('Deadline date parsed:', deadlineDate);
        console.log('Current date:', now);

        const timeDiff = deadlineDate.getTime() - now.getTime();
        const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

        console.log('Time difference (ms):', timeDiff);
        console.log('Days left (calculated):', daysLeft);

        blackholeInfo = {
          date: nextDeadline.date,
          daysLeft: daysLeft,
          isActive: daysLeft > 0,
          status: daysLeft > 30 ? 'safe' : daysLeft > 7 ? 'warning' : 'danger',
          source: nextDeadline.source,
          type: nextDeadline.type,
        };
        console.log('Final deadline info:', blackholeInfo);
      } else {
        console.log(
          'No future deadlines found from API, using fallback deadline...',
        );

        // API에서 찾지 못한 경우 알려진 데드라인 사용 (2025-12-30)
        const fallbackDeadline = new Date('2025-12-30T23:59:59Z');
        const timeDiff = fallbackDeadline.getTime() - now.getTime();
        const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

        console.log('Fallback deadline date:', fallbackDeadline);
        console.log('Fallback days left:', daysLeft);

        blackholeInfo = {
          date: '2025-12-30T23:59:59Z',
          daysLeft: daysLeft,
          isActive: daysLeft > 0,
          status: daysLeft > 30 ? 'safe' : daysLeft > 7 ? 'warning' : 'danger',
          source: 'fallback',
          type: 'Black Hole (Fallback)',
        };
        console.log('Using fallback deadline info:', blackholeInfo);
      }

      // 프로젝트 통계 계산
      const completedProjects = projects.filter(
        (p) => p.status === 'finished' && p['validated?'] === true,
      );
      const inProgressProjects = projects.filter(
        (p) =>
          (p.status === 'in_progress' ||
            p.status === 'waiting_for_correction') &&
          p['validated?'] === null,
      );

      // 과제 요약 로그만 출력
      if (inProgressProjects.length > 0) {
        // console.log('📋 Active Projects:', inProgressProjects.length, 'of', projects.length);
        inProgressProjects.forEach((project, index) => {
          // console.log(`  [${index + 1}] ${project.project?.name} (${project.status})`);
        });
      }

      // 월간 학습 시간 계산 (42 API locations_stats 사용)
      const locationStats = await this.getLocationStats(user.id);
      const monthlyHours = this.calculateMonthlyHours(locationStats);

      // 평가 포인트 (correction_point)
      const evaluationPoints = user.correction_point;

      const result = {
        user,
        level: activeCursus?.level || 0,
        cursusName: activeCursus?.cursus.name || 'Unknown',
        grade: activeCursus?.grade || 'Novice',
        wallet: user.wallet,
        evaluationPoints,
        monthlyHours,
        blackhole: blackholeInfo,
        projects: {
          completed: completedProjects.length,
          inProgress: inProgressProjects.length,
          total: projects.length,
        },
        coalitions,
        recentProjects: projects
          .sort(
            (a, b) =>
              new Date(b.updated_at).getTime() -
              new Date(a.updated_at).getTime(),
          )
          .slice(0, 10),
        activeProjects: inProgressProjects.sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        ),
        skills: activeCursus?.skills || [],
      };

      return result;
    } catch (error) {
      console.error('Error in getUserStats:', error.message);
      if (error instanceof HttpException) {
        console.error(
          'HttpException details:',
          error.getStatus(),
          error.getResponse(),
        );
        throw error;
      }
      console.error('Unexpected error:', error);
      throw new HttpException(
        'Failed to fetch user stats from 42 API',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getLocationStats(userId: number): Promise<Record<string, string>> {
    try {
      const token = await this.getAccessToken();

      // 이번 달 1일부터 말일까지의 날짜 범위 계산
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
      );

      console.log('=== LOCATIONS STATS API DEBUG ===');
      console.log(`User ID: ${userId}`);
      console.log(
        `Date range: ${startOfMonth.toISOString()} to ${endOfMonth.toISOString()}`,
      );
      console.log(
        `API URL: ${this.API_BASE_URL}/users/${userId}/locations_stats`,
      );

      const response = await this.axiosInstance.get<Record<string, string>>(
        `/users/${userId}/locations_stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            'range[begin_at]': `${startOfMonth.toISOString()},${endOfMonth.toISOString()}`,
          },
        },
      );

      console.log(`✅ API Response Status: ${response.status}`);
      console.log(`📊 Response Data Type: ${typeof response.data}`);
      console.log(`📊 Response Data:`, JSON.stringify(response.data, null, 2));

      if (typeof response.data === 'object' && response.data) {
        console.log(
          `🔑 Study dates found: ${Object.keys(response.data).length}`,
        );
        console.log('📅 Study data by date:');
        Object.entries(response.data).forEach(([date, duration]) => {
          console.log(`  ${date}: ${duration}`);
        });
      } else {
        console.log('⚠️ No study data found for the specified date range');
      }

      console.log('=== END LOCATIONS STATS DEBUG ===');

      return response.data || {};
    } catch (error) {
      console.error('❌ Failed to get location stats:');
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      console.error('Error message:', error.message);

      if (error.response?.status === 404) {
        console.log('🔍 User not found or no location data available');
      } else if (error.response?.status === 403) {
        console.log('🔐 Access forbidden - check API permissions');
      } else if (error.response?.status === 429) {
        console.log('⏱️ Rate limit exceeded');
      }

      return {}; // 실패 시 빈 객체 반환
    }
  }

  // Cursus API 테스트
  async testCursusAPI(): Promise<any> {
    console.log('=== CURSUS API TEST ===');
    console.log('Testing GET /v2/cursus');

    try {
      // 첫 번째 페이지
      const response = await this.makeRequest<any>('/cursus');

      // 더 많은 데이터 가져오기 (페이지네이션)
      const response2 = await this.makeRequest<any>('/cursus?page[size]=100&page[number]=0');

      console.log('=== Page 1 Response ===');
      console.log('Page 1 cursus count:', Array.isArray(response) ? response.length : 0);

      console.log('=== Page 2 (Large) Response ===');
      console.log('Page 2 cursus count:', Array.isArray(response2) ? response2.length : 0);

      // 더 큰 응답 사용
      const finalResponse = Array.isArray(response2) && response2.length > 0 ? response2 : response;

      console.log('=== Final Cursus API Response ===');
      console.log('Response type:', typeof finalResponse);
      console.log('Response is array:', Array.isArray(finalResponse));

      if (Array.isArray(finalResponse)) {
        console.log('Number of cursus:', finalResponse.length);

        console.log('\n=== All Cursus List ===');
        finalResponse.forEach((cursus, index) => {
          console.log(`\n--- Cursus ${index + 1} ---`);
          console.log('ID:', cursus.id);
          console.log('Name:', cursus.name);
          console.log('Slug:', cursus.slug);
          console.log('Kind:', cursus.kind);
          console.log('Created at:', cursus.created_at);
          console.log('Updated at:', cursus.updated_at);

          if (cursus.campus) {
            console.log('Campus:', cursus.campus.map((c: any) => `${c.name} (ID: ${c.id})`).join(', '));
          }

          // 추가 필드 확인
          const keys = Object.keys(cursus);
          console.log('All keys:', keys);
        });

        // 42cursus 찾기
        const mainCursus = finalResponse.find((c: any) => c.name === '42cursus' || c.slug === '42cursus');
        if (mainCursus) {
          console.log('\n=== 42cursus Found ===');
          console.log('Full 42cursus data:', JSON.stringify(mainCursus, null, 2));
        }

        // 한국 관련 cursus 찾기
        const koreanCursus = finalResponse.filter((c: any) =>
          c.name?.toLowerCase().includes('korea') ||
          c.name?.toLowerCase().includes('seoul') ||
          c.slug?.toLowerCase().includes('korea') ||
          c.slug?.toLowerCase().includes('seoul')
        );

        if (koreanCursus.length > 0) {
          console.log('\n=== Korean Cursus Found ===');
          koreanCursus.forEach((cursus: any) => {
            console.log('Korean cursus:', JSON.stringify(cursus, null, 2));
          });
        }

      } else {
        console.log('Unexpected response format (not array)');
        console.log('Full response:', JSON.stringify(finalResponse, null, 2));
      }

      console.log('\n=== Complete Response Data ===');
      console.log(JSON.stringify(finalResponse, null, 2));

      console.log('\n=== END CURSUS API TEST ===');
      return finalResponse;
    } catch (error) {
      console.error('Failed to test cursus API:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
      }
      throw error;
    }
  }

  // 42경산 Campus 정보 조회
  async getKyungsanCampusInfo(): Promise<any> {
    console.log('=== CAMPUS INFO TEST ===');
    console.log('Finding 42경산 campus information...');

    try {
      const campusResponse = await this.makeRequest<any>('/campus');
      console.log('Total campus count:', Array.isArray(campusResponse) ? campusResponse.length : 0);

      // 경산 관련 캠퍼스 찾기
      const kyungsanCampus = campusResponse.find((campus: any) =>
        campus.name?.includes('경산') ||
        campus.name?.includes('Kyungsan') ||
        campus.name?.includes('Gyeongsan')
      );

      if (kyungsanCampus) {
        console.log('\n=== 42경산 Campus Found ===');
        console.log('Campus data:', JSON.stringify(kyungsanCampus, null, 2));
        return kyungsanCampus;
      } else {
        console.log('\n=== 42경산 Campus Not Found ===');
        console.log('Available campus names:', campusResponse.map((c: any) => c.name));
        return null;
      }
    } catch (error) {
      console.error('Failed to get campus info:', error);
      return null;
    }
  }

  // 42경산 Project Sessions API 테스트
  async testKyungsanProjectSessions(): Promise<any> {
    console.log('=== 42경산 PROJECT SESSIONS API TEST ===');
    console.log('Testing GET /v2/project_sessions for 42경산 campus');

    try {
      // 1. 먼저 42경산 캠퍼스 정보 조회
      const kyungsanCampus = await this.getKyungsanCampusInfo();

      if (!kyungsanCampus) {
        console.log('❌ 42경산 캠퍼스를 찾을 수 없습니다.');
        return { error: '42경산 캠퍼스를 찾을 수 없습니다.' };
      }

      const campusId = kyungsanCampus.id;
      console.log(`\n📍 42경산 Campus ID: ${campusId}`);

      // 2. 해당 캠퍼스의 project_sessions 조회
      const sessionsUrl = `/project_sessions?filter[campus_id]=${campusId}&page[size]=100`;
      console.log(`🔍 Requesting: ${sessionsUrl}`);

      const sessionsResponse = await this.makeRequest<any>(sessionsUrl);

      // 3. Rate limit을 고려하여 지연
      await this.delay(1000);

      console.log('\n=== 42경산 Project Sessions Response ===');
      console.log('Response type:', typeof sessionsResponse);
      console.log('Is array:', Array.isArray(sessionsResponse));
      console.log('Sessions count:', Array.isArray(sessionsResponse) ? sessionsResponse.length : 0);

      if (Array.isArray(sessionsResponse) && sessionsResponse.length > 0) {
        console.log('\n=== 42경산 Project Sessions List ===');
        sessionsResponse.forEach((session, index) => {
          console.log(`\n--- Session ${index + 1} ---`);
          console.log('ID:', session.id);
          console.log('Project Name:', session.project?.name);
          console.log('Begin At:', session.begin_at);
          console.log('End At:', session.end_at);
          console.log('Deadline At:', session.deadline_at);
          console.log('Estimate Time:', session.estimate_time);
          console.log('Terminating After:', session.terminating_after);
          console.log('Status:', session.status);
          console.log('Solo:', session.solo);
          console.log('Campus ID:', session.campus_id);
          console.log('Cursus ID:', session.cursus_id);
          console.log('Is Subscriptable:', session.is_subscriptable);
          console.log('Max People:', session.max_people);
          console.log('Min People:', session.min_people);
          console.log('Difficulty:', session.difficulty);
          console.log('Duration Days:', session.duration_days);

          if (session.project) {
            console.log('Project Details:');
            console.log('  - Project ID:', session.project.id);
            console.log('  - Project Slug:', session.project.slug);
            console.log('  - Project Description:', session.project.description?.substring(0, 100) + '...');
          }

          console.log('All session keys:', Object.keys(session));
        });

        // 현재 진행 중인 세션 찾기
        const now = new Date();
        const activeSessions = sessionsResponse.filter((session: any) => {
          const beginAt = session.begin_at ? new Date(session.begin_at) : null;
          const endAt = session.end_at ? new Date(session.end_at) : null;

          if (beginAt && endAt) {
            return now >= beginAt && now <= endAt;
          } else if (beginAt && !endAt) {
            return now >= beginAt;
          }
          return false;
        });

        console.log(`\n🔴 현재 진행 중인 세션: ${activeSessions.length}개`);
        if (activeSessions.length > 0) {
          activeSessions.forEach((session: any, index: number) => {
            console.log(`Active Session ${index + 1}:`, session.project?.name);
          });
        }

        // 42cursus 관련 세션 분석
        const cursus42Sessions = sessionsResponse.filter((session: any) =>
          session.cursus_id === 21 // 42cursus ID from previous test
        );

        console.log(`\n📚 전체 세션 중 42cursus 관련: ${cursus42Sessions.length}개`);

        // 42cursus 세션 상세 정보 출력
        if (cursus42Sessions.length > 0) {
          console.log('\n=== 42cursus Sessions Details ===');
          cursus42Sessions.slice(0, 10).forEach((session: any, index: number) => {
            console.log(`\n--- 42cursus Session ${index + 1} ---`);
            console.log('Session ID:', session.id);
            console.log('Project Name:', session.project?.name);
            console.log('Project Slug:', session.project?.slug);
            console.log('Begin At:', session.begin_at);
            console.log('End At:', session.end_at);
            console.log('Deadline At:', session.deadline_at);
            console.log('Estimate Time:', session.estimate_time);
            console.log('Difficulty:', session.difficulty);
            console.log('Solo:', session.solo);
            console.log('Max People:', session.max_people);
            console.log('Is Subscriptable:', session.is_subscriptable);
          });
        }

      } else {
        console.log('❌ 42경산 캠퍼스에서 진행 중인 프로젝트 세션이 없습니다.');
      }

      console.log('\n=== Complete 42경산 Sessions Response ===');
      console.log(JSON.stringify(sessionsResponse, null, 2));

      console.log('\n=== END 42경산 PROJECT SESSIONS TEST ===');
      const cursus42SessionsFiltered = Array.isArray(sessionsResponse) ?
        sessionsResponse.filter((s: any) => s.cursus_id === 21) : [];

      return {
        campus: kyungsanCampus,
        sessions: sessionsResponse,
        cursus42Sessions: cursus42SessionsFiltered,
        totalSessions: Array.isArray(sessionsResponse) ? sessionsResponse.length : 0,
        total42CursusSessions: cursus42SessionsFiltered.length
      };

    } catch (error) {
      console.error('Failed to test 42경산 project sessions:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
      }
      throw error;
    }
  }

  // 42경산 캠퍼스 사용자 API 테스트 메서드
  async testKyungsanUsersAPI(): Promise<any> {
    const logEntries: string[] = [];
    const log = (message: string) => {
      console.log(message);
      logEntries.push(message);
    };

    log('=== 42경산 캠퍼스 /v2/users API TEST ===');
    log(`Test started at: ${new Date().toISOString()}`);
    log('Testing GET /v2/users endpoint for 42경산 campus specifically');

    try {
      // 1. 먼저 42경산 캠퍼스 정보 조회
      log('\n--- Step 1: Finding 42경산 Campus ---');
      const kyungsanCampus = await this.getKyungsanCampusInfo();

      if (!kyungsanCampus) {
        log('❌ 42경산 캠퍼스를 찾을 수 없습니다.');
        throw new Error('42경산 캠퍼스를 찾을 수 없습니다.');
      }

      const campusId = kyungsanCampus.id;
      log(`✅ 42경산 Campus found!`);
      log(`Campus ID: ${campusId}`);
      log(`Campus Name: ${kyungsanCampus.name}`);
      log(`Campus Time Zone: ${kyungsanCampus.time_zone}`);
      log(`Campus Country: ${kyungsanCampus.country}`);

      // 2. 일반 사용자 조회 후 42경산 캠퍼스 사용자 필터링
      log('\n--- Step 2: General Users Query (then filter by campus) ---');
      log('Note: 42 API may not support direct campus_id filtering for users');
      log('Fetching general users and filtering by campus_id manually');

      const generalUsersUrl = `/users?page[size]=100`;
      log(`🔍 Requesting: ${generalUsersUrl}`);

      const generalResponse = await this.makeRequest<any>(generalUsersUrl);

      if (!generalResponse) {
        throw new Error('No response received from general users API');
      }

      log('✅ General response received');
      log(`Response type: ${typeof generalResponse}`);
      log(`Is array: ${Array.isArray(generalResponse)}`);
      log(`Total users fetched: ${Array.isArray(generalResponse) ? generalResponse.length : 0}`);

      // 3. 42경산 캠퍼스 사용자 필터링
      log('\n--- Step 3: Filtering 42경산 Campus Users ---');
      let campusUsers: any[] = [];

      if (Array.isArray(generalResponse)) {
        campusUsers = generalResponse.filter((user: any) =>
          user.campus_id === campusId ||
          user.campus?.id === campusId ||
          (user.campus && user.campus.id === campusId)
        );

        log(`✅ Filtered 42경산 campus users: ${campusUsers.length}`);
        log(`Campus ID to match: ${campusId}`);

        // 첫 번째 일반 사용자의 campus 정보 확인
        if (generalResponse.length > 0) {
          const sampleUser = generalResponse[0];
          log('\n=== Sample User Campus Info ===');
          log(`Sample user campus_id: ${sampleUser.campus_id}`);
          log(`Sample user campus: ${JSON.stringify(sampleUser.campus)}`);
        }
      } else {
        log('❌ General response is not an array');
      }

      // 더 많은 사용자 데이터가 필요한 경우 추가 페이지 조회
      if (campusUsers.length === 0) {
        log('\n--- Step 3.1: Trying with more pages ---');

        for (let page = 2; page <= 5; page++) {
          const pageUrl = `/users?page[number]=${page}&page[size]=100`;
          log(`🔍 Requesting page ${page}: ${pageUrl}`);

          try {
            const pageResponse = await this.makeRequest<any>(pageUrl);

            if (Array.isArray(pageResponse)) {
              const pageCampusUsers = pageResponse.filter((user: any) =>
                user.campus_id === campusId ||
                user.campus?.id === campusId ||
                (user.campus && user.campus.id === campusId)
              );

              campusUsers = campusUsers.concat(pageCampusUsers);
              log(`Page ${page}: Found ${pageCampusUsers.length} 42경산 users (total: ${campusUsers.length})`);

              if (campusUsers.length >= 10) {
                log('Found enough 42경산 users, stopping pagination');
                break;
              }
            }
          } catch (pageError) {
            log(`Failed to fetch page ${page}: ${pageError.message}`);
            break;
          }
        }
      }

      // 4. 사용자 데이터 분석
      const usersToAnalyze = campusUsers;
      log('\n--- Step 4: 42경산 Campus Users Data Analysis ---');
      log(`Total users to analyze: ${usersToAnalyze.length}`);

      if (usersToAnalyze.length === 0) {
        log('⚠️ No users found for 42경산 campus');
        log('This might be because:');
        log('1. The campus has no registered users yet');
        log('2. All users are private/hidden');
        log('3. Different filtering criteria needed');

        // 로그 파일 저장
        const fs = require('fs');
        const path = require('path');
        const logFilePath = path.join(process.cwd(), 'log_v2_users_2.txt');
        fs.writeFileSync(logFilePath, logEntries.join('\n'), 'utf8');

        return {
          campusName: kyungsanCampus.name,
          campusId: campusId,
          totalUsers: 0,
          logFilePath: logFilePath,
          message: 'No users found for 42경산 campus'
        };
      }

      // 첫 번째 사용자 상세 분석
      log('\n=== First 42경산 User Analysis ===');
      const firstUser = usersToAnalyze[0];
      log(`User ID: ${firstUser.id}`);
      log(`Login: ${firstUser.login}`);
      log(`Email: ${firstUser.email}`);
      log(`Display Name: ${firstUser.displayname}`);
      log(`First Name: ${firstUser.first_name}`);
      log(`Last Name: ${firstUser.last_name}`);
      log(`Pool Month/Year: ${firstUser.pool_month} ${firstUser.pool_year}`);
      log(`Staff?: ${firstUser['staff?']}`);
      log(`Alumni?: ${firstUser['alumni?']}`);
      log(`Active?: ${firstUser['active?']}`);
      log(`Campus ID: ${firstUser.campus_id}`);
      log(`Created At: ${firstUser.created_at}`);
      log(`Updated At: ${firstUser.updated_at}`);

      // 5. 42경산 캠퍼스 사용자 통계
      log('\n--- Step 5: 42경산 Campus User Statistics ---');

      const staffUsers = usersToAnalyze.filter((user: any) => user['staff?'] === true);
      const alumniUsers = usersToAnalyze.filter((user: any) => user['alumni?'] === true);
      const activeUsers = usersToAnalyze.filter((user: any) => user['active?'] === true);

      log(`👥 Total 42경산 users analyzed: ${usersToAnalyze.length}`);
      log(`👨‍💼 Staff users: ${staffUsers.length}`);
      log(`🎓 Alumni users: ${alumniUsers.length}`);
      log(`🟢 Active users: ${activeUsers.length}`);
      log(`💤 Inactive users: ${usersToAnalyze.length - activeUsers.length}`);

      // 6. Pool 분포 분석
      log('\n--- Step 6: 42경산 Campus Pool Distribution ---');
      const poolStats: Record<string, number> = {};

      usersToAnalyze.forEach((user: any) => {
        if (user.pool_month && user.pool_year) {
          const poolKey = `${user.pool_year}-${user.pool_month}`;
          poolStats[poolKey] = (poolStats[poolKey] || 0) + 1;
        }
      });

      log('Pool distribution for 42경산:');
      Object.entries(poolStats)
        .sort(([a], [b]) => b.localeCompare(a))
        .forEach(([pool, count]) => {
          log(`  ${pool}: ${count} users`);
        });

      // 7. 최근 가입 사용자 분석
      log('\n--- Step 7: Recent 42경산 Campus Users ---');
      const recentUsers = usersToAnalyze
        .filter((user: any) => user.created_at)
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      log(`Recent 5 users in 42경산:`);
      recentUsers.forEach((user: any, index: number) => {
        log(`  ${index + 1}. ${user.login} (${user.displayname}) - joined ${user.created_at}`);
      });

      // 8. 샘플 사용자 데이터 (처음 3명)
      log('\n--- Step 8: Sample 42경산 Users Data ---');
      const sampleUsers = usersToAnalyze.slice(0, 3);

      sampleUsers.forEach((user: any, index: number) => {
        log(`\n=== 42경산 Sample User ${index + 1} ===`);
        log(JSON.stringify(user, null, 2));
      });

      // 9. 전체 사용자 데이터
      log('\n--- Step 9: All 42경산 Users Data ---');
      log('=== ALL 42경산 USERS DATA ===');
      log(JSON.stringify(usersToAnalyze, null, 2));

      log('\n=== END 42경산 /v2/users API TEST ===');
      log(`Test completed at: ${new Date().toISOString()}`);

      // 로그 파일 저장
      const fs = require('fs');
      const path = require('path');
      const logFilePath = path.join(process.cwd(), 'log_v2_users_2.txt');
      fs.writeFileSync(logFilePath, logEntries.join('\n'), 'utf8');
      log(`\n=== Log file saved to: ${logFilePath} ===`);

      return {
        campusName: kyungsanCampus.name,
        campusId: campusId,
        totalUsers: usersToAnalyze.length,
        staffCount: staffUsers.length,
        alumniCount: alumniUsers.length,
        activeCount: activeUsers.length,
        poolStats: poolStats,
        sampleUsers: sampleUsers.map((user: any) => ({
          id: user.id,
          login: user.login,
          displayname: user.displayname,
          pool: `${user.pool_year}-${user.pool_month}`,
          active: user['active?'],
          staff: user['staff?'],
          alumni: user['alumni?']
        })),
        logFilePath: logFilePath
      };

    } catch (error) {
      const errorMessage = `Failed to analyze 42경산 /v2/users API: ${error.message}`;
      log(errorMessage);
      console.error(errorMessage, error);

      // 에러도 파일에 저장
      const fs = require('fs');
      const path = require('path');
      const logFilePath = path.join(process.cwd(), 'log_v2_users_2.txt');
      fs.writeFileSync(logFilePath, logEntries.join('\n'), 'utf8');

      return {
        error: 'Failed to analyze 42경산 /v2/users API',
        message: error.message,
        logFilePath: logFilePath
      };
    }
  }

  // 캠퍼스 ID로 사용자 필터링 API 테스트 메서드
  async testUsersByCampusIdAPI(): Promise<any> {
    const logEntries: string[] = [];
    const log = (message: string) => {
      console.log(message);
      logEntries.push(message);
    };

    log('=== 캠퍼스 ID 기준 /v2/users API TEST ===');
    log(`Test started at: ${new Date().toISOString()}`);
    log('Testing different methods to filter users by campus ID');

    try {
      // 1. 먼저 42경산 캠퍼스 정보 조회
      log('\n--- Step 1: Finding 42경산 Campus Info ---');
      const kyungsanCampus = await this.getKyungsanCampusInfo();

      if (!kyungsanCampus) {
        log('❌ 42경산 캠퍼스를 찾을 수 없습니다.');
        throw new Error('42경산 캠퍼스를 찾을 수 없습니다.');
      }

      const campusId = kyungsanCampus.id;
      log(`✅ Campus found: ${kyungsanCampus.name} (ID: ${campusId})`);

      // 2. 다양한 필터링 방법 시도
      log('\n--- Step 2: Trying Different Campus Filtering Methods ---');

      const filterMethods = [
        `/users?filter[campus]=${campusId}`,
        `/users?campus_id=${campusId}`,
        `/users?campus=${campusId}`,
        `/users?filter[campus_id]=${campusId}`,
        `/campus/${campusId}/users`,
        `/campus/${campusId}/users?page[size]=50`,
      ];

      let foundUsers: any[] = [];
      let successMethod = '';

      for (const method of filterMethods) {
        log(`\n🔍 Trying method: ${method}`);

        try {
          const response = await this.makeRequest<any>(method);

          if (response && Array.isArray(response) && response.length > 0) {
            log(`✅ Success! Found ${response.length} users with method: ${method}`);
            foundUsers = response;
            successMethod = method;
            break;
          } else if (response && Array.isArray(response)) {
            log(`⚠️ Method worked but returned 0 users: ${method}`);
          } else {
            log(`❌ Method failed or returned non-array: ${method}`);
          }
        } catch (error) {
          log(`❌ Method failed with error: ${method} - ${error.message}`);
        }
      }

      // 3. 성공한 경우 사용자 데이터 분석
      if (foundUsers.length > 0) {
        log(`\n--- Step 3: Analyzing Users from Campus ID ${campusId} ---`);
        log(`✅ Successfully found ${foundUsers.length} users using: ${successMethod}`);
        log(`Campus: ${kyungsanCampus.name} (ID: ${campusId})`);

        // 첫 번째 사용자 상세 분석
        log('\n=== First Campus User Analysis ===');
        const firstUser = foundUsers[0];
        log(`User ID: ${firstUser.id}`);
        log(`Login: ${firstUser.login}`);
        log(`Email: ${firstUser.email}`);
        log(`Display Name: ${firstUser.displayname}`);
        log(`First Name: ${firstUser.first_name}`);
        log(`Last Name: ${firstUser.last_name}`);
        log(`Pool Month/Year: ${firstUser.pool_month} ${firstUser.pool_year}`);
        log(`Staff?: ${firstUser['staff?']}`);
        log(`Alumni?: ${firstUser['alumni?']}`);
        log(`Active?: ${firstUser['active?']}`);
        log(`Campus ID: ${firstUser.campus_id}`);
        log(`Campus: ${JSON.stringify(firstUser.campus)}`);
        log(`Created At: ${firstUser.created_at}`);

        // 사용자 통계
        log('\n--- Step 4: Campus User Statistics ---');
        const staffUsers = foundUsers.filter((user: any) => user['staff?'] === true);
        const alumniUsers = foundUsers.filter((user: any) => user['alumni?'] === true);
        const activeUsers = foundUsers.filter((user: any) => user['active?'] === true);

        log(`👥 Total campus users: ${foundUsers.length}`);
        log(`👨‍💼 Staff users: ${staffUsers.length}`);
        log(`🎓 Alumni users: ${alumniUsers.length}`);
        log(`🟢 Active users: ${activeUsers.length}`);
        log(`💤 Inactive users: ${foundUsers.length - activeUsers.length}`);

        // Pool 분포 분석
        log('\n--- Step 5: Pool Distribution ---');
        const poolStats: Record<string, number> = {};

        foundUsers.forEach((user: any) => {
          if (user.pool_month && user.pool_year) {
            const poolKey = `${user.pool_year}-${user.pool_month}`;
            poolStats[poolKey] = (poolStats[poolKey] || 0) + 1;
          }
        });

        log('Pool distribution:');
        Object.entries(poolStats)
          .sort(([a], [b]) => b.localeCompare(a))
          .forEach(([pool, count]) => {
            log(`  ${pool}: ${count} users`);
          });

        // 최근 가입 사용자
        log('\n--- Step 6: Recent Users ---');
        const recentUsers = foundUsers
          .filter((user: any) => user.created_at)
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);

        log(`Recent 5 users:`);
        recentUsers.forEach((user: any, index: number) => {
          log(`  ${index + 1}. ${user.login} (${user.displayname}) - joined ${user.created_at}`);
        });

        // 샘플 사용자 데이터
        log('\n--- Step 7: Sample Users Data (First 3) ---');
        const sampleUsers = foundUsers.slice(0, 3);

        sampleUsers.forEach((user: any, index: number) => {
          log(`\n=== Sample User ${index + 1} ===`);
          log(JSON.stringify(user, null, 2));
        });

        // 전체 사용자 데이터
        log('\n--- Step 8: All Campus Users Data ---');
        log('=== ALL CAMPUS USERS DATA ===');
        log(JSON.stringify(foundUsers, null, 2));

        log('\n=== SUCCESS: Campus Users Found ===');
        log(`Total users found: ${foundUsers.length}`);
        log(`Method used: ${successMethod}`);

        // 결과 반환
        const result = {
          campusName: kyungsanCampus.name,
          campusId: campusId,
          totalUsers: foundUsers.length,
          staffCount: staffUsers.length,
          alumniCount: alumniUsers.length,
          activeCount: activeUsers.length,
          poolStats: poolStats,
          sampleUsers: sampleUsers.map((user: any) => ({
            id: user.id,
            login: user.login,
            displayname: user.displayname,
            pool: `${user.pool_year}-${user.pool_month}`,
            active: user['active?'],
            staff: user['staff?'],
            alumni: user['alumni?']
          })),
          methodUsed: successMethod,
          logFilePath: ''
        };

        log('\n=== END Campus ID Users API TEST ===');
        log(`Test completed at: ${new Date().toISOString()}`);

        // 로그 파일 저장
        const fs = require('fs');
        const path = require('path');
        const logFilePath = path.join(process.cwd(), 'log_v2_users_3.txt');
        fs.writeFileSync(logFilePath, logEntries.join('\n'), 'utf8');
        log(`\n=== Log file saved to: ${logFilePath} ===`);

        result.logFilePath = logFilePath;
        return result;

      } else {
        // 실패한 경우
        log('\n--- Step 3: No Users Found ---');
        log('❌ All filtering methods failed to find users');
        log('This indicates that:');
        log('1. The campus may not have any users yet');
        log('2. The 42 API may not support campus-based user filtering');
        log('3. Different API endpoints or authentication may be required');

        log('\n=== FAILED: No Campus Users Found ===');
        log('All attempted methods failed');

        log('\n=== END Campus ID Users API TEST ===');
        log(`Test completed at: ${new Date().toISOString()}`);

        // 로그 파일 저장
        const fs = require('fs');
        const path = require('path');
        const logFilePath = path.join(process.cwd(), 'log_v2_users_3.txt');
        fs.writeFileSync(logFilePath, logEntries.join('\n'), 'utf8');

        return {
          campusName: kyungsanCampus.name,
          campusId: campusId,
          totalUsers: 0,
          logFilePath: logFilePath,
          message: 'No users found with any campus filtering method'
        };
      }

    } catch (error) {
      const errorMessage = `Failed to analyze campus users API: ${error.message}`;
      log(errorMessage);
      console.error(errorMessage, error);

      // 에러도 파일에 저장
      const fs = require('fs');
      const path = require('path');
      const logFilePath = path.join(process.cwd(), 'log_v2_users_3.txt');
      fs.writeFileSync(logFilePath, logEntries.join('\n'), 'utf8');

      return {
        error: 'Failed to analyze campus users API',
        message: error.message,
        logFilePath: logFilePath
      };
    }
  }

  // yutsong 사용자 정보 필터링 API 테스트 메서드 (전체 사용자에서 검색)
  async filterYutsongUserAPI(): Promise<any> {
    const logEntries: string[] = [];
    const log = (message: string) => {
      console.log(message);
      logEntries.push(message);
    };

    log('=== YUTSONG 사용자 필터링 API TEST ===');
    log(`Test started at: ${new Date().toISOString()}`);
    log('Searching for yutsong user in all users data');

    try {
      // 1. 직접 yutsong 사용자 조회 시도
      log('\n--- Step 1: Direct yutsong User Lookup ---');
      try {
        const directUserUrl = `/users/yutsong`;
        log(`🔍 Trying direct lookup: ${directUserUrl}`);

        const directUser = await this.makeRequest<any>(directUserUrl);
        if (directUser) {
          log('✅ Found yutsong user via direct lookup!');

          // 직접 조회 성공 시 상세 분석
          log('\n=== YUTSONG USER BASIC INFO (Direct Lookup) ===');
          log(`User ID: ${directUser.id}`);
          log(`Login: ${directUser.login}`);
          log(`Email: ${directUser.email}`);
          log(`Display Name: ${directUser.displayname}`);
          log(`First Name: ${directUser.first_name}`);
          log(`Last Name: ${directUser.last_name}`);
          log(`Usual Full Name: ${directUser.usual_full_name}`);
          log(`Usual First Name: ${directUser.usual_first_name}`);

          log('\n=== YUTSONG USER POOL INFO ===');
          log(`Pool Month: ${directUser.pool_month}`);
          log(`Pool Year: ${directUser.pool_year}`);
          log(`Pool Version: ${directUser.pool_version}`);

          log('\n=== YUTSONG USER STATUS ===');
          log(`Staff?: ${directUser['staff?']}`);
          log(`Alumni?: ${directUser['alumni?']}`);
          log(`Active?: ${directUser['active?']}`);
          log(`Anonymize Date: ${directUser.anonymize_date}`);
          log(`Alumnized At: ${directUser.alumnized_at}`);

          log('\n=== YUTSONG USER CAMPUS INFO ===');
          log(`Campus ID: ${directUser.campus_id}`);
          log(`Campus: ${JSON.stringify(directUser.campus)}`);

          log('\n=== YUTSONG USER DATES ===');
          log(`Created At: ${directUser.created_at}`);
          log(`Updated At: ${directUser.updated_at}`);

          log('\n=== YUTSONG USER IMAGE ===');
          log(`Image URL: ${directUser.image?.link || directUser.image_url || 'No image'}`);
          if (directUser.image) {
            log(`Image Versions: ${JSON.stringify(directUser.image.versions)}`);
          }

          log('\n=== YUTSONG USER ADDITIONAL FIELDS ===');
          const additionalFields = Object.keys(directUser).filter(key =>
            !['id', 'login', 'email', 'displayname', 'first_name', 'last_name',
              'usual_full_name', 'usual_first_name', 'pool_month', 'pool_year',
              'pool_version', 'staff?', 'alumni?', 'active?', 'anonymize_date',
              'alumnized_at', 'campus_id', 'campus', 'created_at', 'updated_at',
              'image', 'image_url'].includes(key)
          );

          log(`Additional fields found: ${additionalFields.length}`);
          additionalFields.forEach(field => {
            log(`${field}: ${JSON.stringify(directUser[field])}`);
          });

          // 전체 JSON 데이터
          log('\n--- Step 2: yutsong User Complete JSON Data ---');
          log('=== YUTSONG USER COMPLETE DATA ===');
          log(JSON.stringify(directUser, null, 2));

          log('\n=== SUCCESS: yutsong User Found via Direct Lookup ===');
          log(`User ID: ${directUser.id}`);
          log(`Login: ${directUser.login}`);
          log(`Display Name: ${directUser.displayname}`);
          log(`Campus ID: ${directUser.campus_id}`);

          log('\n=== END YUTSONG USER FILTER TEST ===');
          log(`Test completed at: ${new Date().toISOString()}`);

          // 로그 파일 저장
          const fs = require('fs');
          const path = require('path');
          const logFilePath = path.join(process.cwd(), 'log_users_yutsong.txt');
          fs.writeFileSync(logFilePath, logEntries.join('\n'), 'utf8');
          log(`\n=== Log file saved to: ${logFilePath} ===`);

          return {
            success: true,
            userFound: true,
            method: 'direct_lookup',
            user: {
              id: directUser.id,
              login: directUser.login,
              email: directUser.email,
              displayname: directUser.displayname,
              firstName: directUser.first_name,
              lastName: directUser.last_name,
              pool: `${directUser.pool_year}-${directUser.pool_month}`,
              active: directUser['active?'],
              staff: directUser['staff?'],
              alumni: directUser['alumni?'],
              campusId: directUser.campus_id,
              createdAt: directUser.created_at
            },
            campusName: directUser.campus?.name || 'Unknown',
            campusId: directUser.campus_id,
            logFilePath: logFilePath
          };
        }
      } catch (directError) {
        log(`⚠️ Direct lookup failed: ${directError.message}`);
      }

      // 2. 일반 사용자 목록에서 검색
      log('\n--- Step 2: Searching in General Users List ---');
      let allUsers: any[] = [];
      let yutsongUser: any = null;

      // 여러 페이지에서 검색
      for (let page = 1; page <= 10; page++) {
        log(`\n🔍 Searching page ${page}...`);
        const usersUrl = `/users?page[number]=${page}&page[size]=100`;
        log(`Requesting: ${usersUrl}`);

        try {
          const pageUsers = await this.makeRequest<any>(usersUrl);

          if (!pageUsers || !Array.isArray(pageUsers)) {
            log(`⚠️ Page ${page}: Invalid or empty response`);
            continue;
          }

          log(`✅ Page ${page}: Found ${pageUsers.length} users`);
          allUsers = allUsers.concat(pageUsers);

          // 이 페이지에서 yutsong 찾기
          const foundUser = pageUsers.find((user: any) =>
            user.login === 'yutsong' ||
            user.login.toLowerCase() === 'yutsong' ||
            user.email?.includes('yutsong') ||
            user.displayname?.toLowerCase().includes('yutsong')
          );

          if (foundUser) {
            log(`🎉 Found yutsong user on page ${page}!`);
            yutsongUser = foundUser;
            break;
          }

          // 빈 페이지면 더 이상 검색 중단
          if (pageUsers.length === 0) {
            log(`Page ${page} is empty, stopping search`);
            break;
          }

        } catch (pageError) {
          log(`❌ Page ${page} failed: ${pageError.message}`);
          break;
        }
      }

      log(`\n총 검색된 사용자 수: ${allUsers.length}`);

      if (!yutsongUser) {
        log('\n--- Step 3: yutsong User Not Found ---');
        log('❌ yutsong 사용자를 전체 사용자 목록에서 찾을 수 없습니다.');
        log('검색된 사용자 샘플 (처음 20명):');
        allUsers.slice(0, 20).forEach((user: any, index: number) => {
          log(`  ${index + 1}. ${user.login} (${user.displayname}) - Campus: ${user.campus_id}`);
        });

        throw new Error('yutsong user not found in any users list');
      }

      // 4. yutsong 사용자 상세 정보 분석
      log('\n--- Step 4: yutsong User Detailed Analysis ---');
      log('✅ yutsong 사용자 발견!');
      log('\n=== YUTSONG USER BASIC INFO ===');
      log(`User ID: ${yutsongUser.id}`);
      log(`Login: ${yutsongUser.login}`);
      log(`Email: ${yutsongUser.email}`);
      log(`Display Name: ${yutsongUser.displayname}`);
      log(`First Name: ${yutsongUser.first_name}`);
      log(`Last Name: ${yutsongUser.last_name}`);
      log(`Usual Full Name: ${yutsongUser.usual_full_name}`);
      log(`Usual First Name: ${yutsongUser.usual_first_name}`);

      log('\n=== YUTSONG USER POOL INFO ===');
      log(`Pool Month: ${yutsongUser.pool_month}`);
      log(`Pool Year: ${yutsongUser.pool_year}`);
      log(`Pool Version: ${yutsongUser.pool_version}`);

      log('\n=== YUTSONG USER STATUS ===');
      log(`Staff?: ${yutsongUser['staff?']}`);
      log(`Alumni?: ${yutsongUser['alumni?']}`);
      log(`Active?: ${yutsongUser['active?']}`);
      log(`Anonymize Date: ${yutsongUser.anonymize_date}`);
      log(`Alumnized At: ${yutsongUser.alumnized_at}`);

      log('\n=== YUTSONG USER CAMPUS INFO ===');
      log(`Campus ID: ${yutsongUser.campus_id}`);
      log(`Campus: ${JSON.stringify(yutsongUser.campus)}`);

      log('\n=== YUTSONG USER DATES ===');
      log(`Created At: ${yutsongUser.created_at}`);
      log(`Updated At: ${yutsongUser.updated_at}`);

      log('\n=== YUTSONG USER IMAGE ===');
      log(`Image URL: ${yutsongUser.image?.link || yutsongUser.image_url || 'No image'}`);
      if (yutsongUser.image) {
        log(`Image Versions: ${JSON.stringify(yutsongUser.image.versions)}`);
      }

      log('\n=== YUTSONG USER ADDITIONAL FIELDS ===');
      const additionalFields = Object.keys(yutsongUser).filter(key =>
        !['id', 'login', 'email', 'displayname', 'first_name', 'last_name',
          'usual_full_name', 'usual_first_name', 'pool_month', 'pool_year',
          'pool_version', 'staff?', 'alumni?', 'active?', 'anonymize_date',
          'alumnized_at', 'campus_id', 'campus', 'created_at', 'updated_at',
          'image', 'image_url'].includes(key)
      );

      log(`Additional fields found: ${additionalFields.length}`);
      additionalFields.forEach(field => {
        log(`${field}: ${JSON.stringify(yutsongUser[field])}`);
      });

      // 5. yutsong 사용자 전체 JSON 데이터
      log('\n--- Step 5: yutsong User Complete JSON Data ---');
      log('=== YUTSONG USER COMPLETE DATA ===');
      log(JSON.stringify(yutsongUser, null, 2));

      // 6. 추가 API 호출 - yutsong 사용자 상세 정보
      log('\n--- Step 6: Additional yutsong User Details ---');
      try {
        log('Attempting to get more detailed user information...');
        const detailedUserUrl = `/users/${yutsongUser.login}`;
        log(`🔍 Requesting detailed info: ${detailedUserUrl}`);

        const detailedUser = await this.makeRequest<any>(detailedUserUrl);
        if (detailedUser) {
          log('✅ Got detailed user information');
          log('\n=== YUTSONG DETAILED USER DATA ===');
          log(JSON.stringify(detailedUser, null, 2));
        }
      } catch (detailError) {
        log(`⚠️ Could not get detailed user info: ${detailError.message}`);
      }

      log('\n=== SUCCESS: yutsong User Found and Analyzed ===');
      log(`User ID: ${yutsongUser.id}`);
      log(`Login: ${yutsongUser.login}`);
      log(`Display Name: ${yutsongUser.displayname}`);
      log(`Campus ID: ${yutsongUser.campus_id}`);

      log('\n=== END YUTSONG USER FILTER TEST ===');
      log(`Test completed at: ${new Date().toISOString()}`);

      // 로그 파일 저장
      const fs = require('fs');
      const path = require('path');
      const logFilePath = path.join(process.cwd(), 'log_users_yutsong.txt');
      fs.writeFileSync(logFilePath, logEntries.join('\n'), 'utf8');
      log(`\n=== Log file saved to: ${logFilePath} ===`);

      return {
        success: true,
        userFound: true,
        user: {
          id: yutsongUser.id,
          login: yutsongUser.login,
          email: yutsongUser.email,
          displayname: yutsongUser.displayname,
          firstName: yutsongUser.first_name,
          lastName: yutsongUser.last_name,
          pool: `${yutsongUser.pool_year}-${yutsongUser.pool_month}`,
          active: yutsongUser['active?'],
          staff: yutsongUser['staff?'],
          alumni: yutsongUser['alumni?'],
          campusId: yutsongUser.campus_id,
          createdAt: yutsongUser.created_at
        },
        campusName: yutsongUser.campus?.name || 'Unknown',
        campusId: yutsongUser.campus_id,
        logFilePath: logFilePath
      };

    } catch (error) {
      const errorMessage = `Failed to filter yutsong user: ${error.message}`;
      log(errorMessage);
      console.error(errorMessage, error);

      // 에러도 파일에 저장
      const fs = require('fs');
      const path = require('path');
      const logFilePath = path.join(process.cwd(), 'log_users_yutsong.txt');
      fs.writeFileSync(logFilePath, logEntries.join('\n'), 'utf8');

      return {
        success: false,
        userFound: false,
        error: 'Failed to filter yutsong user',
        message: error.message,
        logFilePath: logFilePath
      };
    }
  }

  // v2/me API 호출 및 로그 파일 저장
  async testMeAPI(): Promise<any> {
    const logEntries: string[] = [];
    const log = (message: string) => {
      console.log(message);
      logEntries.push(message);
    };

    log('=== 42 API /v2/me TEST ===');
    log(`Test started at: ${new Date().toISOString()}`);
    log('Testing GET /v2/me endpoint');

    try {
      // 1. /v2/me API 호출
      log('\n--- Step 1: Calling /v2/me API ---');
      const meUrl = `/me`;
      log(`🔍 Requesting: ${meUrl}`);

      const meData = await this.makeRequest<any>(meUrl);

      if (!meData) {
        throw new Error('No response received from /v2/me API');
      }

      log('✅ /v2/me API response received');
      log(`Response type: ${typeof meData}`);
      log(`Response keys count: ${Object.keys(meData).length}`);

      // 2. 기본 사용자 정보 분석
      log('\n--- Step 2: Basic User Information Analysis ---');
      log('=== ME API BASIC INFO ===');
      log(`User ID: ${meData.id}`);
      log(`Login: ${meData.login}`);
      log(`Email: ${meData.email}`);
      log(`Display Name: ${meData.displayname}`);
      log(`First Name: ${meData.first_name}`);
      log(`Last Name: ${meData.last_name}`);
      log(`Usual Full Name: ${meData.usual_full_name}`);
      log(`Usual First Name: ${meData.usual_first_name}`);

      // 3. Pool 정보 분석
      log('\n--- Step 3: Pool Information ---');
      log('=== ME API POOL INFO ===');
      log(`Pool Month: ${meData.pool_month}`);
      log(`Pool Year: ${meData.pool_year}`);
      log(`Pool Version: ${meData.pool_version}`);

      // 4. 사용자 상태 분석
      log('\n--- Step 4: User Status Information ---');
      log('=== ME API STATUS INFO ===');
      log(`Staff?: ${meData['staff?']}`);
      log(`Alumni?: ${meData['alumni?']}`);
      log(`Active?: ${meData['active?']}`);
      log(`Anonymize Date: ${meData.anonymize_date}`);
      log(`Alumnized At: ${meData.alumnized_at}`);
      log(`Wallet: ${meData.wallet}`);
      log(`Correction Point: ${meData.correction_point}`);

      // 5. 캠퍼스 정보 분석
      log('\n--- Step 5: Campus Information ---');
      log('=== ME API CAMPUS INFO ===');
      log(`Campus ID: ${meData.campus_id}`);
      if (meData.campus) {
        log(`Campus Name: ${meData.campus.name}`);
        log(`Campus Time Zone: ${meData.campus.time_zone}`);
        log(`Campus Country: ${meData.campus.country}`);
        log(`Campus: ${JSON.stringify(meData.campus, null, 2)}`);
      } else {
        log('Campus: null');
      }

      // 6. 이미지 정보 분석
      log('\n--- Step 6: Image Information ---');
      log('=== ME API IMAGE INFO ===');
      if (meData.image) {
        log(`Image Link: ${meData.image.link}`);
        log(`Image Versions: ${JSON.stringify(meData.image.versions, null, 2)}`);
      } else {
        log('Image: null');
      }

      // 7. Cursus 정보 분석
      log('\n--- Step 7: Cursus Information ---');
      log('=== ME API CURSUS INFO ===');
      if (meData.cursus_users && Array.isArray(meData.cursus_users)) {
        log(`Total cursus: ${meData.cursus_users.length}`);

        meData.cursus_users.forEach((cursusUser: any, index: number) => {
          log(`\n🎓 CURSUS ${index + 1}:`);
          log(`  ID: ${cursusUser.id}`);
          log(`  Begin At: ${cursusUser.begin_at}`);
          log(`  End At: ${cursusUser.end_at}`);
          log(`  Grade: ${cursusUser.grade}`);
          log(`  Level: ${cursusUser.level}`);
          log(`  Blackholed At: ${cursusUser.blackholed_at}`);
          log(`  Has Coalition: ${cursusUser['has_coalition']}`);

          if (cursusUser.cursus) {
            log(`  Cursus Name: ${cursusUser.cursus.name}`);
            log(`  Cursus ID: ${cursusUser.cursus.id}`);
            log(`  Cursus Slug: ${cursusUser.cursus.slug}`);
            log(`  Cursus Kind: ${cursusUser.cursus.kind}`);
          }

          // 블랙홀 분석
          if (cursusUser.blackholed_at) {
            const blackholeDate = new Date(cursusUser.blackholed_at);
            const now = new Date();
            const daysLeft = Math.ceil(
              (blackholeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
            );

            log(`  🕳️ 블랙홀 분석:`);
            log(`    원본 날짜: ${cursusUser.blackholed_at}`);
            log(`    파싱된 날짜: ${blackholeDate.toISOString()}`);
            log(`    남은 일수: ${daysLeft}`);
            log(`    상태: ${daysLeft > 0 ? '활성' : '흡수됨'}`);
          }
        });
      } else {
        log('Cursus Users: null or not array');
      }

      // 8. Projects 정보 분석
      log('\n--- Step 8: Projects Information ---');
      log('=== ME API PROJECTS INFO ===');
      if (meData.projects_users && Array.isArray(meData.projects_users)) {
        log(`Total projects: ${meData.projects_users.length}`);

        // 최근 5개 프로젝트만 상세 분석
        const recentProjects = meData.projects_users.slice(0, 5);
        recentProjects.forEach((project: any, index: number) => {
          log(`\n📁 PROJECT ${index + 1}:`);
          log(`  Status: ${project.status}`);
          log(`  Final Mark: ${project.final_mark}`);
          log(`  Validated?: ${project['validated?']}`);
          log(`  Marked At: ${project.marked_at}`);
          log(`  Retriable At: ${project.retriable_at}`);

          if (project.project) {
            log(`  Project Name: ${project.project.name}`);
            log(`  Project Slug: ${project.project.slug}`);
          }
        });

        // 프로젝트 통계
        const validatedProjects = meData.projects_users.filter((p: any) => p['validated?'] === true);
        const inProgressProjects = meData.projects_users.filter((p: any) => p.status === 'in_progress');
        const finishedProjects = meData.projects_users.filter((p: any) => p.status === 'finished');

        log(`\n📊 프로젝트 통계:`);
        log(`  총 프로젝트: ${meData.projects_users.length}`);
        log(`  검증된 프로젝트: ${validatedProjects.length}`);
        log(`  진행 중: ${inProgressProjects.length}`);
        log(`  완료됨: ${finishedProjects.length}`);
      } else {
        log('Projects Users: null or not array');
      }

      // 9. Skills 정보 분석
      log('\n--- Step 9: Skills Information ---');
      log('=== ME API SKILLS INFO ===');
      if (meData.cursus_users && meData.cursus_users[0] && meData.cursus_users[0].skills) {
        const skills = meData.cursus_users[0].skills;
        log(`Skills count: ${skills.length}`);

        skills.forEach((skill: any, index: number) => {
          log(`  ${index + 1}. ${skill.name}: ${skill.level} (${skill.percentage}%)`);
        });
      } else {
        log('Skills: null or not found');
      }

      // 10. Achievements 정보 분석
      log('\n--- Step 10: Achievements Information ---');
      log('=== ME API ACHIEVEMENTS INFO ===');
      if (meData.achievements && Array.isArray(meData.achievements)) {
        log(`Achievements count: ${meData.achievements.length}`);

        meData.achievements.slice(0, 10).forEach((achievement: any, index: number) => {
          log(`  ${index + 1}. ${achievement.name} - ${achievement.description}`);
        });

        if (meData.achievements.length > 10) {
          log(`  ... and ${meData.achievements.length - 10} more achievements`);
        }
      } else {
        log('Achievements: null or not array');
      }

      // 11. 모든 키 나열
      log('\n--- Step 11: All Available Keys ---');
      log('=== ME API ALL KEYS ===');
      const allKeys = Object.keys(meData);
      log(`Total keys: ${allKeys.length}`);
      allKeys.forEach((key, index) => {
        log(`  ${index + 1}. ${key}: ${typeof meData[key]}`);
      });

      // 12. 전체 JSON 데이터
      log('\n--- Step 12: Complete JSON Response ---');
      log('=== ME API COMPLETE RESPONSE ===');
      log(JSON.stringify(meData, null, 2));

      log('\n=== SUCCESS: /v2/me API Test Completed ===');
      log(`User: ${meData.login} (${meData.displayname})`);
      log(`Campus: ${meData.campus?.name || 'Unknown'}`);
      log(`Level: ${meData.cursus_users?.[0]?.level || 'Unknown'}`);

      log('\n=== END /v2/me API TEST ===');
      log(`Test completed at: ${new Date().toISOString()}`);

      // 로그 파일 저장
      const fs = require('fs');
      const path = require('path');
      const logFilePath = path.join(process.cwd(), 'log_me.txt');
      fs.writeFileSync(logFilePath, logEntries.join('\n'), 'utf8');
      log(`\n=== Log file saved to: ${logFilePath} ===`);

      return {
        success: true,
        user: {
          id: meData.id,
          login: meData.login,
          email: meData.email,
          displayname: meData.displayname,
          firstName: meData.first_name,
          lastName: meData.last_name,
          pool: `${meData.pool_year}-${meData.pool_month}`,
          active: meData['active?'],
          staff: meData['staff?'],
          alumni: meData['alumni?'],
          campusId: meData.campus_id,
          level: meData.cursus_users?.[0]?.level || 0,
          wallet: meData.wallet,
          correctionPoint: meData.correction_point
        },
        campus: meData.campus,
        cursusCount: meData.cursus_users?.length || 0,
        projectsCount: meData.projects_users?.length || 0,
        achievementsCount: meData.achievements?.length || 0,
        logFilePath: logFilePath
      };

    } catch (error) {
      const errorMessage = `Failed to test /v2/me API: ${error.message}`;
      log(errorMessage);
      console.error(errorMessage, error);

      // 에러도 파일에 저장
      const fs = require('fs');
      const path = require('path');
      const logFilePath = path.join(process.cwd(), 'log_me.txt');
      fs.writeFileSync(logFilePath, logEntries.join('\n'), 'utf8');

      return {
        success: false,
        error: 'Failed to test /v2/me API',
        message: error.message,
        logFilePath: logFilePath
      };
    }
  }

  // v3/me API 호출 및 로그 파일 저장
  async testV3MeAPI(): Promise<any> {
    const logEntries: string[] = [];
    const log = (message: string) => {
      console.log(message);
      logEntries.push(message);
    };

    log('=== 42 API /v3/me TEST ===');
    log(`Test started at: ${new Date().toISOString()}`);
    log('Testing GET /v3/me endpoint');

    try {
      // 1. /v3/me API 호출
      log('\n--- Step 1: Calling /v3/me API ---');
      const v3MeUrl = `https://api.intra.42.fr/v3/me`;
      log(`🔍 Requesting: ${v3MeUrl}`);

      const accessToken = await this.getAccessToken();

      const response = await axios.get(v3MeUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: 30000,
      });

      const v3MeData = response.data;

      if (!v3MeData) {
        throw new Error('No response received from /v3/me API');
      }

      log('✅ /v3/me API response received');
      log(`Response type: ${typeof v3MeData}`);
      log(`Response keys count: ${Object.keys(v3MeData).length}`);

      // 2. 기본 사용자 정보 분석
      log('\n--- Step 2: Basic User Information Analysis ---');
      log('=== V3 ME API BASIC INFO ===');
      log(`User ID: ${v3MeData.id || 'N/A'}`);
      log(`Login: ${v3MeData.login || 'N/A'}`);
      log(`Email: ${v3MeData.email || 'N/A'}`);
      log(`Display Name: ${v3MeData.displayname || 'N/A'}`);
      log(`First Name: ${v3MeData.first_name || 'N/A'}`);
      log(`Last Name: ${v3MeData.last_name || 'N/A'}`);
      log(`Staff?: ${v3MeData['staff?'] || false}`);
      log(`Active?: ${v3MeData['active?'] || false}`);
      log(`Alumni?: ${v3MeData['alumni?'] || false}`);

      // 3. 추가 정보 분석
      log('\n--- Step 3: Additional Information Analysis ---');
      log(`Correction Points: ${v3MeData.correction_point || 0}`);
      log(`Wallet: ${v3MeData.wallet || 0}`);
      log(`Location: ${v3MeData.location || 'Not logged in'}`);
      log(`Created At: ${v3MeData.created_at || 'N/A'}`);
      log(`Updated At: ${v3MeData.updated_at || 'N/A'}`);

      // 4. 이미지 정보
      if (v3MeData.image) {
        log('\n--- Step 4: Image Information ---');
        log(`Image Link: ${v3MeData.image.link || 'N/A'}`);
        if (v3MeData.image.versions) {
          log('Image Versions:');
          log(`  - Large: ${v3MeData.image.versions.large || 'N/A'}`);
          log(`  - Medium: ${v3MeData.image.versions.medium || 'N/A'}`);
          log(`  - Small: ${v3MeData.image.versions.small || 'N/A'}`);
          log(`  - Micro: ${v3MeData.image.versions.micro || 'N/A'}`);
        }
      }

      // 5. Cursus 정보
      if (v3MeData.cursus_users && Array.isArray(v3MeData.cursus_users)) {
        log('\n--- Step 5: Cursus Information ---');
        v3MeData.cursus_users.forEach((cursus, index) => {
          log(`\nCursus ${index + 1}:`);
          log(`  - Cursus ID: ${cursus.cursus_id}`);
          log(`  - Cursus Name: ${cursus.cursus?.name || 'N/A'}`);
          log(`  - Level: ${cursus.level}`);
          log(`  - Grade: ${cursus.grade || 'N/A'}`);
          log(`  - Begin At: ${cursus.begin_at}`);
          log(`  - End At: ${cursus.end_at || 'Active'}`);
          log(`  - Blackholed At: ${cursus.blackholed_at || 'N/A'}`);
        });
      }

      // 6. Projects 정보
      if (v3MeData.projects_users && Array.isArray(v3MeData.projects_users)) {
        log('\n--- Step 6: Projects Summary ---');
        log(`Total Projects: ${v3MeData.projects_users.length}`);

        const validatedProjects = v3MeData.projects_users.filter(p => p['validated?'] === true);
        const inProgressProjects = v3MeData.projects_users.filter(p => p.status === 'in_progress');
        const failedProjects = v3MeData.projects_users.filter(p => p['validated?'] === false && p.status === 'finished');

        log(`Validated Projects: ${validatedProjects.length}`);
        log(`In Progress Projects: ${inProgressProjects.length}`);
        log(`Failed Projects: ${failedProjects.length}`);

        // 최근 5개 프로젝트만 표시
        log('\nRecent 5 Projects:');
        v3MeData.projects_users.slice(0, 5).forEach((project) => {
          log(`  - ${project.project?.name || 'Unknown'}: ${project.status} (Mark: ${project.final_mark || 'N/A'})`);
        });
      }

      // 7. Campus 정보
      if (v3MeData.campus) {
        log('\n--- Step 7: Campus Information ---');
        log(`Campus ID: ${v3MeData.campus.id || 'N/A'}`);
        log(`Campus Name: ${v3MeData.campus.name || 'N/A'}`);
        log(`Campus City: ${v3MeData.campus.city || 'N/A'}`);
        log(`Campus Country: ${v3MeData.campus.country || 'N/A'}`);
      }

      // 8. Coalition 정보
      if (v3MeData.coalitions && Array.isArray(v3MeData.coalitions)) {
        log('\n--- Step 8: Coalition Information ---');
        v3MeData.coalitions.forEach((coalition) => {
          log(`Coalition: ${coalition.name || 'N/A'}`);
          log(`  - Score: ${coalition.score || 0}`);
          log(`  - Color: ${coalition.color || 'N/A'}`);
        });
      }

      // 9. 전체 응답 데이터 (JSON)
      log('\n--- Step 9: Complete Response Data ---');
      log('=== FULL V3 ME API RESPONSE ===');
      log(JSON.stringify(v3MeData, null, 2));

      log('\n=== SUCCESS: /v3/me API Test Completed ===');
      log(`User: ${v3MeData.login} (${v3MeData.displayname})`);
      log(`Campus: ${v3MeData.campus?.name || 'Unknown'}`);
      log(`Level: ${v3MeData.cursus_users?.[0]?.level || 'Unknown'}`);

      log('\n=== END /v3/me API TEST ===');
      log(`Test completed at: ${new Date().toISOString()}`);

      // 로그 파일 저장
      const fs = require('fs');
      const path = require('path');
      const logFilePath = path.join(process.cwd(), 'log_v3_me.txt');
      fs.writeFileSync(logFilePath, logEntries.join('\n'), 'utf8');
      log(`\n=== Log file saved to: ${logFilePath} ===`);

      return {
        success: true,
        user: {
          id: v3MeData.id,
          login: v3MeData.login,
          displayname: v3MeData.displayname,
          email: v3MeData.email,
        },
        campus: v3MeData.campus?.name,
        level: v3MeData.cursus_users?.[0]?.level,
        projectsCount: v3MeData.projects_users?.length || 0,
        logFilePath: logFilePath,
      };
    } catch (error) {
      const errorMessage = `Failed to test /v3/me API: ${error.message}`;
      log(errorMessage);
      console.error(errorMessage, error);

      // 에러도 파일에 저장
      const fs = require('fs');
      const path = require('path');
      const logFilePath = path.join(process.cwd(), 'log_v3_me.txt');
      fs.writeFileSync(logFilePath, logEntries.join('\n'), 'utf8');

      return {
        success: false,
        error: 'Failed to test /v3/me API',
        message: error.message,
        logFilePath: logFilePath
      };
    }
  }

  // Users API 테스트 및 로그 파일 저장
  async testUsersAPI(): Promise<any> {
    const logEntries: string[] = [];

    // 로그 함수 정의
    const log = (message: string) => {
      console.log(message);
      logEntries.push(message);
    };

    log('=== 42 API /v2/users TEST ===');
    log(`Test started at: ${new Date().toISOString()}`);
    log('Testing GET /v2/users endpoint');

    try {
      // 1. 기본 users 조회 (첫 번째 페이지)
      log('\n--- Step 1: Basic Users Query ---');
      const basicResponse = await this.makeRequest<any>('/users');
      log(`✅ Basic response received`);
      log(`Response type: ${typeof basicResponse}`);
      log(`Is array: ${Array.isArray(basicResponse)}`);
      log(`Users count: ${Array.isArray(basicResponse) ? basicResponse.length : 0}`);

      // 2. 페이지네이션으로 더 많은 사용자 조회
      log('\n--- Step 2: Paginated Users Query ---');
      const paginatedResponse = await this.makeRequest<any>('/users?page[size]=50&page[number]=0');
      log(`✅ Paginated response received`);
      log(`Paginated users count: ${Array.isArray(paginatedResponse) ? paginatedResponse.length : 0}`);

      // 3. 응답 데이터 분석
      const usersData = Array.isArray(paginatedResponse) && paginatedResponse.length > 0 ?
        paginatedResponse : basicResponse;

      if (Array.isArray(usersData) && usersData.length > 0) {
        log('\n--- Step 3: Users Data Analysis ---');
        log(`Total users to analyze: ${usersData.length}`);

        // 첫 번째 사용자 상세 분석
        const firstUser = usersData[0];
        log('\n=== First User Analysis ===');
        log(`User ID: ${firstUser.id}`);
        log(`Login: ${firstUser.login}`);
        log(`Email: ${firstUser.email}`);
        log(`Display Name: ${firstUser.displayname}`);
        log(`First Name: ${firstUser.first_name}`);
        log(`Last Name: ${firstUser.last_name}`);
        log(`Kind: ${firstUser.kind}`);
        log(`Staff?: ${firstUser['staff?']}`);
        log(`Alumni?: ${firstUser['alumni?']}`);
        log(`Active?: ${firstUser['active?']}`);
        log(`Pool Month: ${firstUser.pool_month}`);
        log(`Pool Year: ${firstUser.pool_year}`);
        log(`Wallet: ${firstUser.wallet}`);
        log(`Correction Point: ${firstUser.correction_point}`);
        log(`Location: ${firstUser.location}`);
        log(`Created At: ${firstUser.created_at}`);
        log(`Updated At: ${firstUser.updated_at}`);

        // 이미지 정보
        if (firstUser.image) {
          log('\n--- User Image Info ---');
          log(`Image Link: ${firstUser.image.link}`);
          if (firstUser.image.versions) {
            log(`Image Versions: ${Object.keys(firstUser.image.versions).join(', ')}`);
          }
        }

        // 전체 필드 목록
        log('\n--- User Object Keys ---');
        log(`Total fields: ${Object.keys(firstUser).length}`);
        log(`All fields: ${Object.keys(firstUser).join(', ')}`);

        // 4. 사용자 통계 분석
        log('\n--- Step 4: Users Statistics ---');

        const staffUsers = usersData.filter(u => u['staff?'] === true);
        const alumniUsers = usersData.filter(u => u['alumni?'] === true);
        const activeUsers = usersData.filter(u => u['active?'] === true);
        const poolUsers = usersData.filter(u => u.pool_month && u.pool_year);

        log(`👨‍💼 Staff users: ${staffUsers.length}`);
        log(`🎓 Alumni users: ${alumniUsers.length}`);
        log(`🟢 Active users: ${activeUsers.length}`);
        log(`🏊‍♂️ Pool participants: ${poolUsers.length}`);

        // Pool 분포 분석
        if (poolUsers.length > 0) {
          log('\n--- Pool Distribution ---');
          const poolDistribution = poolUsers.reduce((acc: any, user: any) => {
            const poolKey = `${user.pool_year}-${user.pool_month}`;
            acc[poolKey] = (acc[poolKey] || 0) + 1;
            return acc;
          }, {});

          Object.entries(poolDistribution)
            .sort(([a], [b]) => b.localeCompare(a))
            .slice(0, 10)
            .forEach(([period, count]) => {
              log(`  ${period}: ${count} users`);
            });
        }

        // 5. 한국 관련 사용자 검색
        log('\n--- Step 5: Korean Users Analysis ---');
        const koreanUsers = usersData.filter((user: any) =>
          user.email?.includes('.kr') ||
          user.login?.includes('kor') ||
          user.location?.includes('Seoul') ||
          user.location?.includes('Gyeongsan')
        );

        log(`🇰🇷 Korean-related users found: ${koreanUsers.length}`);
        if (koreanUsers.length > 0) {
          log('\n--- Korean Users Sample ---');
          koreanUsers.slice(0, 5).forEach((user: any, index: number) => {
            log(`${index + 1}. ${user.login} (${user.email}) - Location: ${user.location}`);
          });
        }

        // 6. 최근 활동 사용자 분석
        log('\n--- Step 6: Recent Activity Analysis ---');
        const recentUsers = usersData.filter((user: any) => {
          if (!user.updated_at) return false;
          const updateDate = new Date(user.updated_at);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return updateDate > thirtyDaysAgo;
        });

        log(`📅 Recently updated users (30 days): ${recentUsers.length}`);

        // 7. 샘플 사용자들 상세 정보
        log('\n--- Step 7: Sample Users Details ---');
        usersData.slice(0, 5).forEach((user: any, index: number) => {
          log(`\n--- User ${index + 1} ---`);
          log(`Login: ${user.login}`);
          log(`Display Name: ${user.displayname}`);
          log(`Email: ${user.email}`);
          log(`Kind: ${user.kind}`);
          log(`Active: ${user['active?']}`);
          log(`Pool: ${user.pool_year}-${user.pool_month}`);
          log(`Wallet: ${user.wallet}`);
          log(`Location: ${user.location}`);
        });

      } else {
        log('❌ No users data received or empty response');
      }

      // 8. 완전한 응답 데이터 (처음 3명만)
      log('\n--- Step 8: Complete Response Sample ---');
      if (Array.isArray(usersData) && usersData.length > 0) {
        log('First 3 users complete data:');
        log(JSON.stringify(usersData.slice(0, 3), null, 2));
      }

      log('\n=== END /v2/users API TEST ===');
      log(`Test completed at: ${new Date().toISOString()}`);

      // 파일에 로그 저장
      const fs = require('fs');
      const path = require('path');
      const logContent = logEntries.join('\n');
      const logFilePath = path.join(process.cwd(), 'log_v2_users.txt');

      try {
        fs.writeFileSync(logFilePath, logContent, 'utf8');
        log(`\n✅ Log file saved: ${logFilePath}`);
        console.log(`✅ Log file saved: ${logFilePath}`);
      } catch (fileError) {
        console.error('Failed to save log file:', fileError);
      }

      return {
        users: usersData,
        totalUsers: Array.isArray(usersData) ? usersData.length : 0,
        logFilePath
      };

    } catch (error) {
      const errorMessage = `❌ Failed to test /v2/users API: ${error.message}`;
      log(errorMessage);
      console.error(errorMessage, error);

      if (axios.isAxiosError(error)) {
        log(`Response status: ${error.response?.status}`);
        log(`Response data: ${JSON.stringify(error.response?.data)}`);
      }

      // 에러도 파일에 저장
      const fs = require('fs');
      const path = require('path');
      const logContent = logEntries.join('\n');
      const logFilePath = path.join(process.cwd(), 'log_v2_users.txt');

      try {
        fs.writeFileSync(logFilePath, logContent, 'utf8');
        console.log(`📁 Error log saved: ${logFilePath}`);
      } catch (fileError) {
        console.error('Failed to save error log file:', fileError);
      }

      throw error;
    }
  }

  // Project Sessions API 테스트
  async testProjectSessions(sessionId: number): Promise<any> {
    console.log('=== PROJECT SESSIONS API TEST ===');
    console.log(`Testing GET /v2/project_sessions/${sessionId}`);

    try {
      const response = await this.makeRequest<any>(`/project_sessions/${sessionId}`);

      console.log('=== Project Session Response ===');
      console.log('Full response:', JSON.stringify(response, null, 2));

      // 응답 구조 분석
      console.log('\n=== Response Structure Analysis ===');
      console.log('Response type:', typeof response);
      console.log('Response keys:', Object.keys(response));

      if (response) {
        // 기본 정보
        console.log('\n=== Basic Info ===');
        console.log('ID:', response.id);
        console.log('Name:', response.name);
        console.log('Description:', response.description);
        console.log('Status:', response.status);

        // 날짜 정보
        console.log('\n=== Date Info ===');
        console.log('Begin at:', response.begin_at);
        console.log('End at:', response.end_at);
        console.log('Created at:', response.created_at);
        console.log('Updated at:', response.updated_at);
        console.log('Estimate time:', response.estimate_time);
        console.log('Deadline at:', response.deadline_at);
        console.log('Terminating after:', response.terminating_after);

        // 프로젝트 정보
        if (response.project) {
          console.log('\n=== Project Info ===');
          console.log('Project ID:', response.project.id);
          console.log('Project Name:', response.project.name);
          console.log('Project Slug:', response.project.slug);
          console.log('Project keys:', Object.keys(response.project));
        }

        // Campus 정보
        if (response.campus) {
          console.log('\n=== Campus Info ===');
          console.log('Campus ID:', response.campus.id);
          console.log('Campus Name:', response.campus.name);
        }

        // Cursus 정보
        if (response.cursus) {
          console.log('\n=== Cursus Info ===');
          console.log('Cursus ID:', response.cursus.id);
          console.log('Cursus Name:', response.cursus.name);
        }

        // Scale 정보
        if (response.scales) {
          console.log('\n=== Scales Info ===');
          console.log('Scales count:', response.scales.length);
          if (response.scales.length > 0) {
            console.log('First scale:', JSON.stringify(response.scales[0], null, 2));
          }
        }

        // Uploads 정보
        if (response.uploads) {
          console.log('\n=== Uploads Info ===');
          console.log('Uploads count:', response.uploads.length);
          if (response.uploads.length > 0) {
            console.log('First upload:', JSON.stringify(response.uploads[0], null, 2));
          }
        }

        // Teams 정보
        if (response.teams) {
          console.log('\n=== Teams Info ===');
          console.log('Teams count:', response.teams.length);
        }

        // 기타 필드
        console.log('\n=== Other Fields ===');
        console.log('Solo:', response.solo);
        console.log('Is subscriptable:', response.is_subscriptable);
        console.log('Max people:', response.max_people);
        console.log('Min people:', response.min_people);
        console.log('Difficulty:', response.difficulty);
        console.log('Duration days:', response.duration_days);
      }

      console.log('\n=== END PROJECT SESSIONS API TEST ===');
      return response;
    } catch (error) {
      console.error('Failed to test project sessions API:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
      }
      throw error;
    }
  }

  private calculateMonthlyHours(locationStats: Record<string, string>): number {
    console.log('=== MONTHLY HOURS CALCULATION DEBUG ===');

    if (!locationStats || Object.keys(locationStats).length === 0) {
      console.log('⚠️ No location stats data provided for calculation');
      return 0;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    console.log(
      `📅 Current date: ${now.toLocaleDateString('ko-KR')} (Year: ${currentYear}, Month: ${currentMonth + 1})`,
    );
    console.log(
      `📊 Processing location stats with ${Object.keys(locationStats).length} date entries`,
    );

    let totalHours = 0;
    const processedDates: string[] = [];

    // 시간 문자열을 시간으로 변환하는 함수 (HH:MM:SS.microseconds -> hours)
    const parseTimeToHours = (timeString: string): number => {
      const parts = timeString.split(':');
      if (parts.length !== 3) return 0;

      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      const seconds = parseFloat(parts[2]); // 소수점 초 포함

      return hours + minutes / 60 + seconds / 3600;
    };

    // {학습일자: 학습시간} 구조에서 해당 월의 모든 학습시간 합산
    Object.entries(locationStats).forEach(([dateString, durationString]) => {
      console.log(`\n🔄 Processing date: ${dateString}`);
      console.log(`  Duration string: ${durationString}`);

      // 날짜 문자열을 년-월-일로 파싱 (시간대 문제 방지)
      const dateParts = dateString.split('-');
      if (dateParts.length !== 3) {
        console.log(`  ❌ Invalid date format: ${dateString}`);
        return;
      }

      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1; // 0-based
      const day = parseInt(dateParts[2], 10);

      // 유효성 검사
      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        console.log(`  ❌ Invalid date parts: ${dateString}`);
        return;
      }

      // 현재 월에 속하는지 확인
      const isWithinMonth = year === currentYear && month === currentMonth;

      console.log(`  📅 Study date: ${year}-${month + 1}-${day}`);
      console.log(`  ✓ Within current month: ${isWithinMonth}`);

      if (
        isWithinMonth &&
        typeof durationString === 'string' &&
        durationString.trim()
      ) {
        const hours = parseTimeToHours(durationString);

        if (hours > 0) {
          totalHours += hours;
          processedDates.push(dateString);
          // console.log(`  ✅ Parsed duration: ${hours.toFixed(2)} hours`);
          // console.log(`  📈 Running total: ${totalHours.toFixed(2)} hours`);
        } else {
          // console.log(`  ⏭️ Skipped - invalid parsed hours: ${hours}`);
        }
      } else {
        if (!isWithinMonth) {
          console.log(`  ⏭️ Skipped - not in current month`);
        } else {
          console.log(
            `  ⏭️ Skipped - invalid duration string: ${durationString}`,
          );
        }
      }
    });

    // console.log(`\n📋 Summary:`);
    // console.log(`  Total dates processed: ${processedDates.length}`);
    // console.log(`  Processed dates: ${processedDates.join(', ')}`);
    // console.log(`  Total study hours: ${totalHours.toFixed(2)} hours`);

    const finalHours = Math.round(totalHours * 10) / 10;
    // console.log(`\n🎯 Final calculation result: ${finalHours} hours`);
    console.log('=== END MONTHLY HOURS CALCULATION DEBUG ===');

    return finalHours;
  }
}
