import {
  Controller,
  Get,
  UseGuards,
  Req,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SendVerificationDto } from './dto/send-verification.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SlackService } from './services/slack.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private slackService: SlackService,
  ) {}

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '로그아웃', description: '현재 JWT 토큰을 블랙리스트에 추가하여 무효화합니다.' })
  @ApiResponse({ status: 200, description: '로그아웃 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: any) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    await this.authService.logout(req.user.userId, token);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '현재 사용자 정보 조회', description: 'JWT 토큰으로 현재 로그인한 사용자 정보를 조회합니다.' })
  @ApiResponse({ status: 200, description: '사용자 정보 조회 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async getProfile(@Req() req: any) {
    return req.user;
  }

  @Post('send-verification')
  @ApiOperation({
    summary: 'Slack 인증 코드 전송',
    description: '인트라 ID로 Slack 사용자를 검색하여 6자리 인증 코드를 DM으로 전송합니다.'
  })
  @ApiBody({ type: SendVerificationDto })
  @ApiResponse({ status: 200, description: '인증 코드 전송 성공' })
  @ApiResponse({ status: 400, description: 'Slack에서 사용자를 찾을 수 없음' })
  @ApiResponse({ status: 429, description: 'Rate Limit 초과 (60초에 3번)' })
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async sendVerification(@Body() sendVerificationDto: SendVerificationDto) {
    await this.slackService.sendVerificationCode(sendVerificationDto.intraId);
    return { message: '인증 코드가 슬랙 DM으로 전송되었습니다. 5분 이내에 입력해주세요.' };
  }

  @Post('verify-code')
  @ApiOperation({
    summary: 'Slack 인증 코드 확인',
    description: 'Slack DM으로 받은 6자리 인증 코드를 확인합니다.'
  })
  @ApiBody({ type: VerifyCodeDto })
  @ApiResponse({ status: 200, description: '인증 코드 확인 결과' })
  @ApiResponse({ status: 429, description: 'Rate Limit 초과 (60초에 10번)' })
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async verifyCode(@Body() verifyCodeDto: VerifyCodeDto) {
    const isValid = await this.slackService.verifyCode(
      verifyCodeDto.intraId,
      verifyCodeDto.code,
    );

    if (!isValid) {
      return {
        success: false,
        message: '인증 코드가 올바르지 않거나 만료되었습니다.',
      };
    }

    return {
      success: true,
      message: '인증이 완료되었습니다.',
    };
  }

  @Post('register')
  @ApiOperation({
    summary: '회원가입',
    description: 'Slack 인증 완료 후 회원가입을 진행합니다.'
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: '회원가입 성공' })
  @ApiResponse({ status: 400, description: '인증 미완료 또는 유효성 검증 실패' })
  @ApiResponse({ status: 409, description: '이미 사용 중인 인트라 ID' })
  @ApiResponse({ status: 429, description: 'Rate Limit 초과 (1시간에 3번)' })
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
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
  async login(@Body() loginDto: LoginDto, @Req() req: any) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return await this.authService.login(loginDto, ipAddress, userAgent);
  }
}
