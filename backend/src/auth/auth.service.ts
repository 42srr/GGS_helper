import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { User } from '../user/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TokenBlacklistService } from './token-blacklist.service';
import { SlackService } from './services/slack.service';
import { AdminService } from '../admin/admin.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private userService: UserService,
    private tokenBlacklistService: TokenBlacklistService,
    private slackService: SlackService,
    private adminService: AdminService,
  ) {}

  async logout(userId: number, token: string): Promise<void> {
    if (!token) {
      return;
    }

    try {
      // JWT 토큰 디코드하여 만료 시간 확인
      const decoded = this.jwtService.decode(token) as any;

      if (!decoded || !decoded.exp) {
        return;
      }

      // 현재 시간과 만료 시간 차이 계산 (초)
      const currentTime = Math.floor(Date.now() / 1000);
      const expiresIn = decoded.exp - currentTime;

      if (expiresIn <= 0) {
        return;
      }

      // 토큰을 블랙리스트에 추가
      await this.tokenBlacklistService.addToBlacklist(token, expiresIn);

      // 세션 종료
      await this.adminService.endSession(userId);
    } catch (error) {
      this.logger.error(`Logout failed for user ${userId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('로그아웃 처리 중 오류가 발생했습니다.');
    }
  }

  // 새로운 인증 시스템 메서드
  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    const { intraId, password, verificationCode } = registerDto;

    // 슬랙 인증 코드 확인
    const isVerified = await this.slackService.isCodeVerified(intraId);
    if (!isVerified) {
      throw new BadRequestException('인증 코드가 유효하지 않거나 만료되었습니다. 인증 코드를 다시 요청해주세요.');
    }

    // intraId 중복 체크
    const existingUser = await this.userService.findByIntraId(intraId);
    if (existingUser) {
      throw new ConflictException('해당 인트라 ID는 이미 사용 중입니다');
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    await this.userService.create({
      intraId,
      password: hashedPassword,
    });

    // 인증 완료 후 슬랙 인증 데이터 삭제
    await this.slackService.deleteVerification(intraId);

    return { message: '회원가입이 완료되었습니다. 로그인해주세요.' };
  }

  async login(
    loginDto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{
    access_token: string;
    user: {
      userId: number;
      intraId: string;
      role: string;
    };
  }> {
    const { intraId, password } = loginDto;

    // intraId로 사용자 조회
    const user = await this.userService.findByIntraId(intraId);
    if (!user) {
      throw new UnauthorizedException('인트라 ID 또는 비밀번호가 올바르지 않습니다');
    }

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('인트라 ID 또는 비밀번호가 올바르지 않습니다');
    }

    // JWT 생성 (JWT 표준에 맞춰 sub 사용)
    const payload = {
      sub: user.userId,
      userId: user.userId,
      role: user.role
    };
    const accessToken = this.jwtService.sign(payload);

    // 마지막 로그인 시간 업데이트
    await this.userService.updateLastLogin(user.userId);

    // 세션 생성
    await this.adminService.createSession(user.userId, ipAddress, userAgent);

    return {
      access_token: accessToken,
      user: {
        userId: user.userId,
        intraId: user.intraId,
        role: user.role,
      },
    };
  }
}
