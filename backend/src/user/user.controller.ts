import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Patch,
  Param,
  Body,
  Res,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  RequirePermissions,
  OwnerOnly,
} from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { Api42Service } from '../api-42/api-42.service';
import * as fs from 'fs';
import * as path from 'path';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly api42Service: Api42Service,
  ) {}

  private parseJsonField(field: any): any {
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch (error) {
        console.error('Failed to parse JSON field:', error);
        return null;
      }
    }
    return field;
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermissions('user:read')
  async findAll(@Query('role') role?: Role) {
    if (role) {
      return await this.userService.getUsersByRole(role);
    }
    return await this.userService.findAllWithReservationCount();
  }

  @Get('export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermissions('user:export')
  async exportToExcel(@Res() res: Response) {
    const buffer = await this.userService.exportToExcel();
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=users_${new Date().toISOString().split('T')[0]}.xlsx`,
    });
    res.send(buffer);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermissions('user:update')
  async update(@Param('id') id: string, @Body() updateData: any) {
    return await this.userService.updateUser(+id, updateData);
  }

  @Patch(':id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermissions('user:role:update')
  async updateUserRole(@Param('id') id: string, @Body('role') role: Role) {
    return await this.userService.updateUserRole(+id, role);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @OwnerOnly()
  async getUserStats(@Req() req: any) {
    return await this.userService.getUserStats(req.user.userId);
  }

  @Post('stats/refresh')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @OwnerOnly()
  async refreshUserStats(@Req() req: any) {
    console.log('Refresh stats requested - forcing API update');

    // 42 API에서 최신 데이터를 가져와서 데이터베이스에 저장
    const updatedUser = await this.userService.refreshUserStats(req.user.userId);

    // 데이터베이스에 저장된 정보를 반환 (dashboard와 동일한 형식)
    return {
      user: {
        id: updatedUser.userId,
        email: updatedUser.intraId + '@student.42seoul.kr',
        login: updatedUser.intraId,
        displayName: updatedUser.name,
        firstName: updatedUser.name,
        lastName: '',
        imageUrl: updatedUser.profileImgUrl,
      },
      stats: {
        level: updatedUser.info?.level || 0,
        wallet: updatedUser.info?.wallet || 0,
        correctionPoint: updatedUser.info?.evalPoint || 0,
        monthlyHours: updatedUser.info?.studyTime || 0,
        cursusName: '42cursus',
        grade: updatedUser.grade || 'Novice',
        blackhole: null,
        coalitions: updatedUser.info?.coalition ? [{ name: updatedUser.info.coalition }] : [],
        skills: [],
        projectStats: {
          completed: 0,
          inProgress: 0,
          total: 0,
        },
        recentProjects: [],
        activeProjects: updatedUser.info?.activeProject ? JSON.parse(updatedUser.info.activeProject) : [],
        dataLastUpdated: updatedUser.info?.lastUpdateedAt,
      },
    };
  }

  @Get('test-me-api')
  async testMeAPI() {
    console.log('=== Testing /v2/me API ===');
    console.log(`Time: ${new Date().toISOString()}`);

    try {
      const result = await this.api42Service.testMeAPI();

      console.log('\n=== /v2/me API test completed successfully ===');
      console.log('Check server logs and log_me.txt file for detailed information');

      return {
        success: result.success,
        message: '/v2/me API 테스트가 완료되었습니다 - log_me.txt 파일과 서버 로그를 확인하세요',
        user: result.user,
        campus: result.campus,
        cursusCount: result.cursusCount,
        projectsCount: result.projectsCount,
        achievementsCount: result.achievementsCount,
        logFilePath: result.logFilePath
      };
    } catch (error) {
      console.error('Failed to test /v2/me API:', error);
      return {
        success: false,
        error: 'Failed to test /v2/me API',
        message: error.message,
        hint: '42 API 인증 정보와 /v2/me 엔드포인트 접근 권한을 확인하세요'
      };
    }
  }

  // 디버그용 테스트 엔드포인트 - 개발 시 필요하면 주석 해제
  // @Get('test-cursus-data')
  // async testCursusData() {
  //   console.log('=== Testing cursus data for yutsong ===');
  //   try {
  //     const userDetail = await this.api42Service.analyzeUserDetailAPI('yutsong');
  //     // ... 분석 로직
  //     return {
  //       message: 'Cursus data analysis completed - check server logs',
  //       cursus_count: userDetail?.cursus_users?.length || 0,
  //     };
  //   } catch (error) {
  //     console.error('Failed to analyze cursus data:', error);
  //     return {
  //       error: 'Failed to analyze cursus data',
  //       message: error.message,
  //     };
  //   }
  // }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @OwnerOnly()
  async getDashboardData(@Req() req: any) {
    // getUserStats는 자동으로 데이터 업데이트를 확인하고 필요시 42 API를 호출함
    const user = await this.userService.getUserStats(req.user.userId);

    // 대시보드에 필요한 형태로 데이터 변환
    return {
      user: {
        id: user.userId,
        email: user.intraId + '@student.42seoul.kr',
        login: user.intraId,
        displayName: user.name,
        firstName: user.name,
        lastName: '',
        imageUrl: user.profileImgUrl,
      },
      stats: {
        level: user.info?.level || 0,
        wallet: user.info?.wallet || 0,
        correctionPoint: user.info?.evalPoint || 0,
        monthlyHours: user.info?.studyTime || 0,
        cursusName: '42cursus',
        grade: user.grade || 'Novice',
        blackhole: null,  // 프론트엔드에서 제거 예정
        coalitions: user.info?.coalition ? [{ name: user.info.coalition }] : [],
        skills: [],  // 프론트엔드에서 제거 예정
        projectStats: {  // 프론트엔드에서 제거 예정
          completed: 0,
          inProgress: 0,
          total: 0,
        },
        recentProjects: [],  // 프론트엔드에서 제거 예정
        activeProjects: user.info?.activeProject ? JSON.parse(user.info.activeProject) : [],
        dataLastUpdated: user.info?.lastUpdateedAt,
      },
    };
  }

  // REMOVED: make-me-admin endpoint for security reasons
  // Admin users must be created manually via database or CLI tool

  // 임시 테스트용 엔드포인트 - 프로젝트 데이터 강제 업데이트
  @Post('force-update-projects')
  @UseGuards(JwtAuthGuard)
  async forceUpdateProjects(@Req() req: any) {
    const updatedUser = await this.userService.updateUserStatsFromApi(req.user.userId);
    return {
      message: '프로젝트 데이터가 강제로 업데이트되었습니다.',
      activeProjects: updatedUser.info?.activeProject ? JSON.parse(updatedUser.info.activeProject) : [],
      recentProjects: [],
      dataLastUpdated: updatedUser.info?.lastUpdateedAt
    };
  }

  // 임시 개발용 엔드포인트 - 사용자 데이터 초기화 (새로운 컬럼 대응)
  @Post('reset-cache')
  @UseGuards(JwtAuthGuard)
  async resetUserCache(@Req() req: any) {
    // dataLastUpdated를 null로 설정하여 다음 접속 시 강제 업데이트
    await this.userService.updateUser(req.user.userId, {
      dataLastUpdated: null,
      activeProjects: null,
      recentProjects: null
    });

    return {
      message: '사용자 캐시가 초기화되었습니다. 새로고침하면 최신 데이터를 가져옵니다.',
      userId: req.user.userId
    };
  }

  // Cursus API 테스트 엔드포인트
  @Get('test-cursus')
  async testCursus() {
    console.log(`\n=== Testing Cursus API ===`);
    console.log(`Time: ${new Date().toISOString()}`);

    try {
      const cursusData = await this.api42Service.testCursusAPI();

      console.log('\n=== Cursus test completed successfully ===');
      console.log('Check server logs for detailed information');

      return {
        success: true,
        message: 'Cursus data retrieved successfully - check server logs for details',
        cursusCount: Array.isArray(cursusData) ? cursusData.length : 0,
        cursusNames: Array.isArray(cursusData) ? cursusData.map((c: any) => c.name) : [],
        mainCursus: Array.isArray(cursusData) ? cursusData.find((c: any) => c.name === '42cursus' || c.slug === '42cursus') : null,
        dataKeys: Array.isArray(cursusData) && cursusData.length > 0 ? Object.keys(cursusData[0]) : [],
      };
    } catch (error) {
      console.error('Failed to test cursus:', error);
      return {
        success: false,
        error: 'Failed to test cursus API',
        message: error.message,
        hint: 'Check 42 API credentials and network connectivity'
      };
    }
  }

  // 42경산 Project Sessions API 테스트 엔드포인트
  @Get('test-kyungsan-sessions')
  async testKyungsanProjectSessions() {
    console.log(`\n=== Testing 42경산 Project Sessions API ===`);
    console.log(`Time: ${new Date().toISOString()}`);

    try {
      const result = await this.api42Service.testKyungsanProjectSessions();

      console.log('\n=== 42경산 Project Sessions test completed successfully ===');
      console.log('Check server logs for detailed information');

      return {
        success: true,
        message: '42경산 캠퍼스 프로젝트 세션 데이터를 성공적으로 조회했습니다 - 자세한 내용은 서버 로그를 확인하세요',
        campusName: result.campus?.name,
        campusId: result.campus?.id,
        totalSessions: result.totalSessions,
        total42CursusSessions: result.total42CursusSessions,
        sessionsPreview: Array.isArray(result.sessions) ?
          result.sessions.slice(0, 3).map((s: any) => ({
            id: s.id,
            projectName: s.project?.name,
            beginAt: s.begin_at,
            endAt: s.end_at,
            cursusId: s.cursus_id
          })) : [],
        cursus42Preview: Array.isArray(result.cursus42Sessions) ?
          result.cursus42Sessions.slice(0, 5).map((s: any) => ({
            id: s.id,
            projectName: s.project?.name,
            projectSlug: s.project?.slug,
            difficulty: s.difficulty,
            solo: s.solo,
            maxPeople: s.max_people,
            estimateTime: s.estimate_time
          })) : [],
        dataKeys: Array.isArray(result.sessions) && result.sessions.length > 0 ?
          Object.keys(result.sessions[0]) : [],
      };
    } catch (error) {
      console.error('Failed to test 42경산 project sessions:', error);
      return {
        success: false,
        error: 'Failed to test 42경산 project sessions API',
        message: error.message,
        hint: '42경산 캠퍼스 정보를 확인하거나 네트워크 연결을 확인하세요'
      };
    }
  }

  // Project Sessions API 테스트 엔드포인트
  @Get('test-project-sessions/:id')
  async testProjectSessions(@Param('id') id: string) {
    console.log(`\n=== Testing Project Sessions API with ID: ${id} ===`);
    console.log(`Time: ${new Date().toISOString()}`);

    try {
      const sessionData = await this.api42Service.testProjectSessions(+id);

      console.log('\n=== Test completed successfully ===');
      console.log('Check server logs for detailed information');

      return {
        success: true,
        message: `Project session ${id} data retrieved successfully - check server logs for details`,
        sessionId: sessionData?.id,
        sessionName: sessionData?.name,
        projectName: sessionData?.project?.name,
        beginAt: sessionData?.begin_at,
        endAt: sessionData?.end_at,
        deadlineAt: sessionData?.deadline_at,
        estimateTime: sessionData?.estimate_time,
        terminatingAfter: sessionData?.terminating_after,
        status: sessionData?.status,
        dataKeys: Object.keys(sessionData || {}),
      };
    } catch (error) {
      console.error('Failed to test project sessions:', error);
      return {
        success: false,
        error: 'Failed to test project sessions API',
        message: error.message,
        hint: 'Try different session IDs like 1, 10, 100, 1000, etc.'
      };
    }
  }

  // v2/me API 테스트 엔드포인트 - 로그를 log_me.txt 파일에 저장
  @Get('test-me-endpoint')
  async testMeEndpoint() {
    console.log(`\n=== Testing /v2/me API ===`);
    console.log(`Time: ${new Date().toISOString()}`);

    try {
      const result = await this.api42Service.testMeAPI();

      console.log('\n=== /v2/me API test completed successfully ===');
      console.log('Check server logs and log_me.txt file for detailed information');

      return {
        success: result.success,
        message: '/v2/me API 테스트가 완료되었습니다 - log_me.txt 파일과 서버 로그를 확인하세요',
        user: result.user,
        campus: result.campus,
        cursusCount: result.cursusCount,
        projectsCount: result.projectsCount,
        achievementsCount: result.achievementsCount,
        logFilePath: result.logFilePath
      };
    } catch (error) {
      console.error('Failed to test /v2/me API:', error);
      return {
        success: false,
        error: 'Failed to test /v2/me API',
        message: error.message,
        hint: '42 API 인증 정보와 /v2/me 엔드포인트 접근 권한을 확인하세요'
      };
    }
  }

  // Users API 테스트 엔드포인트 - 로그를 log_v2_users.txt 파일에 저장
  @Get('test-users')
  async testUsersAPI() {
    console.log(`\n=== Testing /v2/users API ===`);
    console.log(`Time: ${new Date().toISOString()}`);

    try {
      const result = await this.api42Service.testUsersAPI();

      console.log('\n=== /v2/users API test completed successfully ===');
      console.log('Check server logs and log_v2_users.txt file for detailed information');

      return {
        success: true,
        message: '/v2/users API 테스트가 완료되었습니다 - log_v2_users.txt 파일과 서버 로그를 확인하세요',
        totalUsers: result.totalUsers,
        totalPages: result.totalPages,
        staffCount: result.staffCount,
        alumniCount: result.alumniCount,
        activeCount: result.activeCount,
        logFilePath: result.logFilePath,
        sampleUsers: result.sampleUsers || [],
        poolStats: result.poolStats || {}
      };
    } catch (error) {
      console.error('Failed to test /v2/users API:', error);
      return {
        success: false,
        error: 'Failed to test /v2/users API',
        message: error.message,
        hint: '42 API 인증 정보와 네트워크 연결을 확인하세요'
      };
    }
  }

  // 42경산 캠퍼스 Users API 테스트 엔드포인트 - 로그를 log_v2_users_2.txt 파일에 저장
  @Get('test-kyungsan-users')
  async testKyungsanUsersAPI() {
    console.log(`\n=== Testing 42경산 Campus /v2/users API ===`);
    console.log(`Time: ${new Date().toISOString()}`);

    try {
      const result = await this.api42Service.testKyungsanUsersAPI();

      console.log('\n=== 42경산 Campus /v2/users API test completed successfully ===');
      console.log('Check server logs and log_v2_users_2.txt file for detailed information');

      return {
        success: true,
        message: '42경산 캠퍼스 /v2/users API 테스트가 완료되었습니다 - log_v2_users_2.txt 파일과 서버 로그를 확인하세요',
        campusName: result.campusName,
        campusId: result.campusId,
        totalUsers: result.totalUsers,
        staffCount: result.staffCount,
        alumniCount: result.alumniCount,
        activeCount: result.activeCount,
        logFilePath: result.logFilePath,
        sampleUsers: result.sampleUsers || [],
        poolStats: result.poolStats || {}
      };
    } catch (error) {
      console.error('Failed to test 42경산 /v2/users API:', error);
      return {
        success: false,
        error: 'Failed to test 42경산 /v2/users API',
        message: error.message,
        hint: '42경산 캠퍼스 정보와 네트워크 연결을 확인하세요'
      };
    }
  }

  // 캠퍼스 ID 기준 Users API 테스트 엔드포인트 - 로그를 log_v2_users_3.txt 파일에 저장
  @Get('test-campus-users')
  async testUsersByCampusIdAPI() {
    console.log(`\n=== Testing Campus ID Based /v2/users API ===`);
    console.log(`Time: ${new Date().toISOString()}`);

    try {
      const result = await this.api42Service.testUsersByCampusIdAPI();

      console.log('\n=== Campus ID based /v2/users API test completed successfully ===');
      console.log('Check server logs and log_v2_users_3.txt file for detailed information');

      return {
        success: true,
        message: '캠퍼스 ID 기준 /v2/users API 테스트가 완료되었습니다 - log_v2_users_3.txt 파일과 서버 로그를 확인하세요',
        campusName: result.campusName,
        campusId: result.campusId,
        totalUsers: result.totalUsers,
        staffCount: result.staffCount,
        alumniCount: result.alumniCount,
        activeCount: result.activeCount,
        methodUsed: result.methodUsed,
        logFilePath: result.logFilePath,
        sampleUsers: result.sampleUsers || [],
        poolStats: result.poolStats || {}
      };
    } catch (error) {
      console.error('Failed to test campus ID based /v2/users API:', error);
      return {
        success: false,
        error: 'Failed to test campus ID based /v2/users API',
        message: error.message,
        hint: '캠퍼스 ID와 42 API 연결을 확인하세요'
      };
    }
  }

  // yutsong 사용자 필터링 엔드포인트 - 로그를 log_users_yutsong.txt 파일에 저장
  @Get('filter-yutsong')
  async filterYutsongUserAPI() {
    console.log(`\n=== Filtering yutsong User from Campus Users ===`);
    console.log(`Time: ${new Date().toISOString()}`);

    try {
      const result = await this.api42Service.filterYutsongUserAPI();

      console.log('\n=== yutsong User filtering completed successfully ===');
      console.log('Check server logs and log_users_yutsong.txt file for detailed information');

      return {
        success: result.success,
        message: result.userFound
          ? 'yutsong 사용자 필터링이 완료되었습니다 - log_users_yutsong.txt 파일과 서버 로그를 확인하세요'
          : 'yutsong 사용자를 찾을 수 없습니다 - log_users_yutsong.txt 파일에서 상세 내용을 확인하세요',
        userFound: result.userFound,
        user: result.user || null,
        campusName: result.campusName,
        campusId: result.campusId,
        logFilePath: result.logFilePath
      };
    } catch (error) {
      console.error('Failed to filter yutsong user:', error);
      return {
        success: false,
        userFound: false,
        error: 'Failed to filter yutsong user',
        message: error.message,
        hint: 'yutsong 사용자 정보와 42 API 연결을 확인하세요'
      };
    }
  }

  // v2/me API 테스트 엔드포인트 - 로그를 log_me.txt 파일에 저장
  @Get('test-me')
  async testMe() {
    console.log(`\n=== Testing /v2/me API ===`);
    console.log(`Time: ${new Date().toISOString()}`);

    try {
      const result = await this.api42Service.testMeAPI();

      console.log('\n=== /v2/me API test completed successfully ===');
      console.log('Check server logs and log_me.txt file for detailed information');

      return {
        success: result.success,
        message: '/v2/me API 테스트가 완료되었습니다 - log_me.txt 파일과 서버 로그를 확인하세요',
        user: result.user,
        campus: result.campus,
        cursusCount: result.cursusCount,
        projectsCount: result.projectsCount,
        achievementsCount: result.achievementsCount,
        logFilePath: result.logFilePath
      };
    } catch (error) {
      console.error('Failed to test /v2/me API:', error);
      return {
        success: false,
        error: 'Failed to test /v2/me API',
        message: error.message,
        hint: '42 API 인증 정보와 /v2/me 엔드포인트 접근 권한을 확인하세요'
      };
    }
  }

  // v3/me API 테스트 엔드포인트 - 로그를 log_v3_me.txt 파일에 저장
  @Get('test-v3-me')
  async testV3Me() {
    console.log(`\n=== Testing /v3/me API ===`);
    console.log(`Time: ${new Date().toISOString()}`);

    try {
      const result = await this.api42Service.testV3MeAPI();

      console.log('\n=== /v3/me API test completed successfully ===');
      console.log('Check server logs and log_v3_me.txt file for detailed information');

      return {
        success: result.success,
        message: '/v3/me API 테스트가 완료되었습니다 - log_v3_me.txt 파일과 서버 로그를 확인하세요',
        user: result.user,
        campus: result.campus,
        level: result.level,
        projectsCount: result.projectsCount,
        logFilePath: result.logFilePath
      };
    } catch (error) {
      console.error('Failed to test /v3/me API:', error);
      return {
        success: false,
        error: 'Failed to test /v3/me API',
        message: error.message,
        hint: '42 API 인증 정보와 /v3/me 엔드포인트 접근 권한을 확인하세요'
      };
    }
  }
}
