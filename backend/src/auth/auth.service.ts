import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { User } from '../user/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TokenBlacklistService } from './token-blacklist.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private userService: UserService,
    private tokenBlacklistService: TokenBlacklistService,
  ) {}

  async logout(userId: number, token: string): Promise<void> {
    if (!token) {
      console.warn('[AUTH] Logout called without token');
      return;
    }

    try {
      // JWT 토큰 디코드하여 만료 시간 확인
      const decoded = this.jwtService.decode(token) as any;

      if (!decoded || !decoded.exp) {
        console.warn('[AUTH] Invalid token format, cannot blacklist');
        return;
      }

      // 현재 시간과 만료 시간 차이 계산 (초)
      const currentTime = Math.floor(Date.now() / 1000);
      const expiresIn = decoded.exp - currentTime;

      if (expiresIn <= 0) {
        console.log('[AUTH] Token already expired, no need to blacklist');
        return;
      }

      // 토큰을 블랙리스트에 추가
      await this.tokenBlacklistService.addToBlacklist(token, expiresIn);

      console.log(`[AUTH] User ${userId} logged out successfully, token blacklisted for ${expiresIn}s`);
    } catch (error) {
      console.error('[AUTH] Error during logout:', error);
      throw error;
    }
  }

  // 새로운 인증 시스템 메서드
  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    const { email, password, username, name } = registerDto;

    // username 중복 체크
    const existingUser = await this.userService.findByUsername(username);
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    // 이메일 중복 체크
    const existingEmail = await this.userService.findByEmail(email);
    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    await this.userService.create({
      email,
      username,
      name,
      password: hashedPassword,
    });

    return { message: 'Registration successful. You can now login.' };
  }

  async login(loginDto: LoginDto): Promise<{
    access_token: string;
    user: {
      userId: number;
      email: string;
      username: string;
      name: string;
      role: string;
    };
  }> {
    const { username, password } = loginDto;

    // username으로 사용자 조회
    const user = await this.userService.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
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

    return {
      access_token: accessToken,
      user: {
        userId: user.userId,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    };
  }
}
