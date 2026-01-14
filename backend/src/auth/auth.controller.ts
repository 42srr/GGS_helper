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
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
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

  // 새로운 인증 엔드포인트
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
