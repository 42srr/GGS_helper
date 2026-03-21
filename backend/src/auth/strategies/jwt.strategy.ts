import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { UserService } from '../../user/user.service';
import { TokenBlacklistService } from '../token-blacklist.service';
import { JwtPayload } from '../../common/interfaces/authenticated-request.interface';

function extractTokenFromCookieOrHeader(req: Request): string | null {
  // 1. 쿠키에서 추출
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }
  // 2. Authorization 헤더에서 추출 (API 호환성)
  return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
    private tokenBlacklistService: TokenBlacklistService,
  ) {
    super({
      jwtFromRequest: extractTokenFromCookieOrHeader,
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', { infer: true }) ?? (() => { throw new Error('JWT_SECRET environment variable is required'); })(),
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: JwtPayload) {
    const token = extractTokenFromCookieOrHeader(request);

    // 블랙리스트 확인
    if (token) {
      const isBlacklisted = await this.tokenBlacklistService.isBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedException('토큰이 무효화되었습니다. 다시 로그인해주세요.');
      }
    }

    // 사용자 확인
    const user = await this.userService.findOne(payload.sub);
    if (!user || !user.isAvailable) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
