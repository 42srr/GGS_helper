import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-42';
import { AuthService } from '../auth.service';
import { Api42ConfigService } from '../../api-42/api-42-config.service';

@Injectable()
export class FtStrategy extends PassportStrategy(Strategy, '42') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
    private api42ConfigService: Api42ConfigService,
  ) {
    super({
      clientID: configService.get<string>('FORTYTWO_CLIENT_ID'),
      clientSecret: api42ConfigService.getClientSecret(), // 동적 키 사용
      callbackURL: configService.get<string>('FORTYTWO_CALLBACK_URL'),
      scope: 'public',
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    // 42 API doesn't always provide refresh token, use access token as fallback
    const tokenToUse = refreshToken || accessToken;
    const user = await this.authService.validateOAuthLogin(profile, tokenToUse);
    return user;
  }
}
