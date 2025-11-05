import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { User } from '../user/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private userService: UserService,
  ) {}

  async validateOAuthLogin(profile: any, refreshToken: string): Promise<any> {
    if (!profile || !profile._json) {
      throw new Error('Invalid profile data received from 42 API');
    }

    const user = await this.userService.findOrCreate(profile._json);

    if (!refreshToken) {
      throw new Error('No refresh token provided by 42 API');
    }

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.userService.updateRefreshToken(user.userId, hashedRefreshToken);

    const payload = {
      intraId: user.intraId,
      sub: user.userId,
      role: user.role,
    };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      refresh_token: refreshToken,
      user: {
        userId: user.userId,
        intraId: user.intraId,
        name: user.name,
        profileImgUrl: user.profileImgUrl,
        role: user.role,
        grade: user.grade,
      },
    };
  }

  async generateTokens(
    user: User,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const payload = {
      intraId: user.intraId,
      sub: user.userId,
      role: user.role,
    };
    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(payload, {
      expiresIn: '30d',
    });

    const hashedRefreshToken = await bcrypt.hash(refresh_token, 10);
    await this.userService.updateRefreshToken(user.userId, hashedRefreshToken);

    return { access_token, refresh_token };
  }

  async refreshToken(
    userId: number,
    refreshToken: string,
  ): Promise<{ access_token: string }> {
    const user = await this.userService.findOne(userId);
    if (!user || !user.refreshToken) {
      throw new Error('User not found or no refresh token');
    }

    const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isValid) {
      throw new Error('Invalid refresh token');
    }

    const payload = {
      intraId: user.intraId,
      sub: user.userId,
      role: user.role,
    };
    const access_token = this.jwtService.sign(payload);

    return { access_token };
  }

  async logout(userId: number): Promise<void> {
    await this.userService.clearRefreshToken(userId);
  }
}
