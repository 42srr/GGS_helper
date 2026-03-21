import {
  Controller,
  Get,
  UseGuards,
  Req,
  Res,
  Post,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { ConfigService } from '@nestjs/config';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: false, // 프로덕션에서는 true로 변경 (HTTPS 필수)
  sameSite: 'lax' as const,
  path: '/',
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  private getCookieOptions() {
    const useSecure = this.configService.get('COOKIE_SECURE', 'false') === 'true';
    return {
      ...COOKIE_OPTIONS,
      secure: useSecure,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '로그아웃' })
  @ApiResponse({ status: 200, description: '로그아웃 성공' })
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: AuthenticatedRequest, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.accessToken || req.headers.authorization?.replace('Bearer ', '') || '';
    await this.authService.logout(req.user.userId, token);

    const options = this.getCookieOptions();
    res.clearCookie('accessToken', options);
    res.clearCookie('refreshToken', options);

    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '현재 사용자 정보 조회' })
  @ApiResponse({ status: 200, description: '사용자 정보 조회 성공' })
  async getProfile(@Req() req: AuthenticatedRequest) {
    return req.user;
  }

  @Post('register')
  @ApiOperation({ summary: '회원가입' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: '회원가입 성공' })
  @ApiResponse({ status: 409, description: '이미 사용 중인 인트라 ID' })
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '비밀번호 변경' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, description: '비밀번호 변경 성공' })
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return await this.authService.changePassword(req.user.userId, changePasswordDto);
  }

  @Post('login')
  @ApiOperation({ summary: '로그인' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: '로그인 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const forwardedFor = req.headers['x-forwarded-for'];
    const ipAddress = req.ip || (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor) || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await this.authService.login(loginDto, ipAddress, userAgent);
    const options = this.getCookieOptions();

    // httpOnly 쿠키로 토큰 설정
    res.cookie('accessToken', result.access_token, {
      ...options,
      maxAge: 60 * 60 * 1000, // 1시간
    });
    res.cookie('refreshToken', result.refresh_token, {
      ...options,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
    });

    // 응답 body에는 사용자 정보만 반환 (토큰은 쿠키로)
    return { user: result.user };
  }

  @Post('refresh')
  @ApiOperation({ summary: '토큰 갱신' })
  @ApiResponse({ status: 200, description: '토큰 갱신 성공' })
  @ApiResponse({ status: 401, description: '갱신 실패' })
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: '토큰이 없습니다' });
    }

    const result = await this.authService.refreshAccessToken(refreshToken);
    const options = this.getCookieOptions();

    res.cookie('accessToken', result.access_token, {
      ...options,
      maxAge: 60 * 60 * 1000,
    });

    return { message: 'Token refreshed' };
  }
}
