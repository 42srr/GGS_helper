import { Request } from 'express';
import { User } from '../../user/entities/user.entity';

/**
 * JWT 인증된 요청 인터페이스
 * Passport JWT Strategy의 validate 메서드에서 반환된 User 객체가 포함됨
 */
export interface AuthenticatedRequest extends Request {
  user: User;
}

/**
 * JWT 토큰 페이로드 (로그인 시 생성되는 토큰의 페이로드)
 */
export interface JwtPayload {
  sub: number;
  intraId: string;
  role: string;
  iat?: number;
  exp?: number;
}
