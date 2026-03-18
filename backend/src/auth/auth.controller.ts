import {
  Controller,
  Get,
  UseGuards,
  Req,
  Post,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
  ) {}

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '로그아웃', description: '현재 JWT 토큰을 블랙리스트에 추가하여 무효화합니다.' })
  @ApiResponse({ status: 200, description: '로그아웃 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: AuthenticatedRequest) {
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    await this.authService.logout(req.user.userId, token);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '현재 사용자 정보 조회', description: 'JWT 토큰으로 현재 로그인한 사용자 정보를 조회합니다.' })
  @ApiResponse({ status: 200, description: '사용자 정보 조회 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async getProfile(@Req() req: AuthenticatedRequest) {
    return req.user;
  }

  @Post('register')
  @ApiOperation({
    summary: '회원가입',
    description: '이름, 인트라 ID, 비밀번호로 회원가입을 진행합니다.'
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: '회원가입 성공' })
  @ApiResponse({ status: 400, description: '유효성 검증 실패' })
  @ApiResponse({ status: 409, description: '이미 사용 중인 인트라 ID' })
  @ApiResponse({ status: 429, description: 'Rate Limit 초과 (1시간에 3번)' })
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '비밀번호 변경',
    description: '현재 비밀번호를 확인한 후 새 비밀번호로 변경합니다.'
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, description: '비밀번호 변경 성공' })
  @ApiResponse({ status: 400, description: '현재 비밀번호 불일치 또는 유효성 검증 실패' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return await this.authService.changePassword(req.user.userId, changePasswordDto);
  }

  @Post('login')
  @ApiOperation({
    summary: '로그인',
    description: '인트라 ID와 비밀번호로 로그인하여 JWT 토큰을 발급받습니다.'
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: '로그인 성공' })
  @ApiResponse({ status: 401, description: '인트라 ID 또는 비밀번호가 올바르지 않음' })
  @ApiResponse({ status: 429, description: 'Rate Limit 초과 (60초에 5번)' })
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const forwardedFor = req.headers['x-forwarded-for'];
    const ipAddress = req.ip || (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor) || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return await this.authService.login(loginDto, ipAddress, userAgent);
  }
}
