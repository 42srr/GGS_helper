import { Controller, Get, Post, Put, Body, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { Api42ConfigService } from './api-42-config.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequirePermissions } from '../auth/decorators/roles.decorator';

// DTO
class SetNewSecretDto {
  secret: string;
}

@Controller('api42-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@RequirePermissions('admin:*')
export class Api42AdminController {
  constructor(private api42ConfigService: Api42ConfigService) {}

  // 현재 설정 정보 조회
  @Get('config-info')
  getConfigInfo() {
    const info = this.api42ConfigService.getConfigInfo();
    return {
      message: '현재 API 키 설정 정보 (Dual Key 방식)',
      ...info,
      instructions: {
        setNewSecret: 'POST /api42-admin/set-new-secret - 새 Secret 추가 (dual key)',
        promoteSecret: 'POST /api42-admin/promote-secret - 새 Secret을 primary로 승격',
        removeNewSecret: 'POST /api42-admin/remove-new-secret - 새 Secret 제거',
        reloadConfig: 'POST /api42-admin/reload-config - 설정 파일 다시 로드',
      },
    };
  }

  // 새로운 Secret 키 추가 (dual key 모드)
  @Post('set-new-secret')
  setNewSecret(@Body() dto: SetNewSecretDto) {
    if (!dto.secret || dto.secret.length < 10) {
      throw new HttpException('Invalid secret key', HttpStatus.BAD_REQUEST);
    }

    this.api42ConfigService.setNewClientSecret(dto.secret);

    return {
      success: true,
      message: '새로운 API Secret이 추가되었습니다.',
      note: 'Dual key 모드가 활성화되었습니다. 현재 키와 새 키 모두 유효합니다.',
    };
  }

  // 새 키를 primary로 승격
  @Post('promote-secret')
  promoteSecret() {
    const info = this.api42ConfigService.getConfigInfo();
    if (!info.newSecretActive) {
      throw new HttpException('No new secret to promote', HttpStatus.BAD_REQUEST);
    }

    this.api42ConfigService.promoteNewSecret();

    return {
      success: true,
      message: '새로운 Secret이 primary로 승격되었습니다.',
      note: '이전 키는 제거되었습니다.',
    };
  }

  // 새 키 제거 (롤백)
  @Post('remove-new-secret')
  removeNewSecret() {
    const info = this.api42ConfigService.getConfigInfo();
    if (!info.newSecretActive) {
      throw new HttpException('No new secret to remove', HttpStatus.BAD_REQUEST);
    }

    this.api42ConfigService.removeNewSecret();

    return {
      success: true,
      message: '새로운 Secret이 제거되었습니다.',
      note: '현재 키만 사용합니다.',
    };
  }

  // 설정 파일 다시 로드
  @Post('reload-config')
  reloadConfig() {
    this.api42ConfigService.reloadConfig();

    return {
      success: true,
      message: '설정 파일을 다시 로드했습니다.',
      currentConfig: this.api42ConfigService.getConfigInfo(),
    };
  }

  // 사용 예시를 반환하는 도움말 엔드포인트
  @Get('help')
  getHelp() {
    return {
      message: '42 API 키 관리 시스템 사용법 (Dual Key 방식)',
      note: '모든 엔드포인트는 JWT 인증 및 관리자 권한(admin:*)이 필요합니다.',
      concept: {
        dualKey: 'Dual Key 방식은 두 개의 키를 동시에 지원하여 무중단 키 교체를 가능하게 합니다.',
        workflow: [
          '1. 42에서 새 키를 미리 발급받음',
          '2. set-new-secret으로 새 키를 추가 (현재 키 + 새 키 모두 유효)',
          '3. 42에서 키 전환 완료 후',
          '4. promote-secret으로 새 키를 primary로 승격',
        ],
      },
      endpoints: {
        '1. 현재 설정 조회': {
          method: 'GET',
          url: '/api42-admin/config-info',
          description: '현재 키와 새 키의 상태를 확인합니다.',
        },
        '2. 새 키 추가 (Dual Key)': {
          method: 'POST',
          url: '/api42-admin/set-new-secret',
          body: { secret: 'new-secret-key' },
          description: '새 키를 추가하여 dual key 모드를 활성화합니다.',
        },
        '3. 새 키를 Primary로 승격': {
          method: 'POST',
          url: '/api42-admin/promote-secret',
          description: '새 키를 primary로 만들고 이전 키를 제거합니다.',
        },
        '4. 새 키 제거 (롤백)': {
          method: 'POST',
          url: '/api42-admin/remove-new-secret',
          description: '새 키를 제거하고 현재 키만 사용합니다.',
        },
      },
    };
  }
}