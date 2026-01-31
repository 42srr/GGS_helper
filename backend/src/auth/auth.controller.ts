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
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SendVerificationDto } from './dto/send-verification.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SlackService } from './services/slack.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private slackService: SlackService,
  ) {}

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: any) {
    // 요청 헤더에서 토큰 추출
    const token = req.headers.authorization?.replace('Bearer ', '');
    await this.authService.logout(req.user.userId, token);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: any) {
    return req.user;
  }

  /**
   * 슬랙 인증 코드 전송
   * 60초에 3번까지만 허용
   */
  @Post('send-verification')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })  // 60초에 3번
  async sendVerification(@Body() sendVerificationDto: SendVerificationDto) {
    await this.slackService.sendVerificationCode(sendVerificationDto.intraId);
    return { message: '인증 코드가 슬랙 DM으로 전송되었습니다. 5분 이내에 입력해주세요.' };
  }

  /**
   * 슬랙 인증 코드 확인
   * 60초에 10번까지만 허용
   */
  @Post('verify-code')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })  // 60초에 10번
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

  /**
   * 회원가입 - 스팸 계정 생성 방지
   * 1시간(3600초)에 3번까지만 허용
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 3, ttl: 3600000 } })  // 3600초(1시간)에 3번
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }

  /**
   * 로그인 - Brute Force 방지를 위해 엄격한 제한
   * 60초에 5번까지만 허용
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })  // 60초에 5번
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }
}
