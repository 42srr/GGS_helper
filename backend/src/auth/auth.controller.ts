import {
  Controller,
  Get,
  UseGuards,
  Req,
  Res,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { FtAuthGuard } from './guards/ft-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Request, Response } from 'express';
import { Api42ConfigService } from '../api-42/api-42-config.service';
import axios from 'axios';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
    private api42ConfigService: Api42ConfigService,
  ) {}

  @Get('42')
  async ftAuth(@Res() res: Response) {
    // 직접 OAuth URL 생성 (Passport 우회하여 동적 키 사용)
    const clientId = this.configService.get<string>('FORTYTWO_CLIENT_ID') || '';
    const redirectUri = this.configService.get<string>('FORTYTWO_CALLBACK_URL') || '';
    const authUrl = `https://api.intra.42.fr/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=public`;
    res.redirect(authUrl);
  }

  @Get('42/callback')
  async ftAuthCallback(@Query('code') code: string, @Res() res: Response) {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );

    try {
      if (!code) {
        throw new Error('No authorization code provided');
      }

      const clientId = this.configService.get<string>('FORTYTWO_CLIENT_ID') || '';
      const redirectUri = this.configService.get<string>('FORTYTWO_CALLBACK_URL') || '';

      // Dual key: 모든 유효한 키 가져오기
      const allSecrets = this.api42ConfigService.getAllClientSecrets();
      console.log(`Trying ${allSecrets.length} secret key(s)...`);

      let tokenResponse: any = null;
      let lastError: any = null;

      // 모든 키를 순차적으로 시도 (fallback)
      for (let i = 0; i < allSecrets.length; i++) {
        const secret = allSecrets[i];
        console.log(`Attempt ${i + 1}: Using client secret: ${secret.substring(0, 15)}...`);

        try {
          tokenResponse = await axios.post('https://api.intra.42.fr/oauth/token', {
            grant_type: 'authorization_code',
            client_id: clientId,
            client_secret: secret,
            code: code,
            redirect_uri: redirectUri,
          });

          console.log(`✅ Success with secret ${i + 1}`);

          // Secondary 키로 성공하면 자동 승격
          if (i > 0) {
            console.log('🔄 Secondary key succeeded. Auto-promoting to primary...');
            try {
              this.api42ConfigService.promoteNewSecret();
              console.log('✅ Secondary key promoted to primary successfully');
            } catch (promoteError) {
              console.error('Failed to auto-promote secondary key:', promoteError);
            }
          }

          break; // 성공하면 중단
        } catch (error) {
          lastError = error;
          console.log(`❌ Failed with secret ${i + 1}:`, error.response?.data?.error || error.message);

          // 마지막 키도 실패하면 에러 throw
          if (i === allSecrets.length - 1) {
            throw lastError;
          }
        }
      }

      if (!tokenResponse) {
        throw new Error('All client secrets failed');
      }

      const { access_token, refresh_token } = tokenResponse.data;

      // 사용자 정보 가져오기
      const userResponse = await axios.get('https://api.intra.42.fr/v2/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const profile = userResponse.data;

      // AuthService를 통해 사용자 생성/조회 및 JWT 발급
      const authResult = await this.authService.validateOAuthLogin(
        { _json: profile },
        refresh_token || access_token,
      );

      // Frontend로 리다이렉트
      res.redirect(
        `${frontendUrl}/auth/callback?access_token=${authResult.access_token}&refresh_token=${authResult.refresh_token}&user=${encodeURIComponent(JSON.stringify(authResult.user))}`,
      );
    } catch (error) {
      console.error('OAuth callback error:', error.response?.data || error.message);
      res.redirect(
        `${frontendUrl}/login?error=${encodeURIComponent(error.response?.data?.error_description || error.message || 'Authentication failed')}`,
      );
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() body: { userId: number; refreshToken: string }) {
    const { access_token } = await this.authService.refreshToken(
      body.userId,
      body.refreshToken,
    );
    return { access_token };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: any) {
    await this.authService.logout(req.user.userId);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: any) {
    return req.user;
  }
}
