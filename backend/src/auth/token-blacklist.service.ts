import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class TokenBlacklistService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis | null = null;
  private useRedis: boolean = false;
  private memoryBlacklist: Set<string> = new Set();

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl);
        this.useRedis = true;
        console.log('✅ Redis connected for token blacklist');
      } catch (error) {
        console.warn('⚠️  Redis connection failed, using in-memory blacklist:', error.message);
        this.useRedis = false;
      }
    } else {
      console.log('ℹ️  REDIS_URL not configured, using in-memory blacklist');
      this.useRedis = false;
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
    }
  }

  /**
   * 토큰을 블랙리스트에 추가
   * @param token JWT 토큰
   * @param expiresIn 토큰 만료까지 남은 시간 (초)
   */
  async addToBlacklist(token: string, expiresIn: number): Promise<void> {
    const key = `blacklist:${token}`;

    if (this.useRedis && this.redis) {
      // Redis에 저장 (TTL 설정)
      await this.redis.setex(key, expiresIn, '1');
      console.log(`[TOKEN-BLACKLIST] Token added to Redis blacklist (TTL: ${expiresIn}s)`);
    } else {
      // 메모리에 저장
      this.memoryBlacklist.add(token);
      console.log(`[TOKEN-BLACKLIST] Token added to memory blacklist`);

      // TTL 시뮬레이션 - expiresIn 후 자동 삭제
      setTimeout(() => {
        this.memoryBlacklist.delete(token);
        console.log(`[TOKEN-BLACKLIST] Token expired and removed from memory blacklist`);
      }, expiresIn * 1000);
    }
  }

  /**
   * 토큰이 블랙리스트에 있는지 확인
   * @param token JWT 토큰
   * @returns true if blacklisted
   */
  async isBlacklisted(token: string): Promise<boolean> {
    const key = `blacklist:${token}`;

    if (this.useRedis && this.redis) {
      const result = await this.redis.get(key);
      return result === '1';
    } else {
      return this.memoryBlacklist.has(token);
    }
  }

  /**
   * 사용자의 모든 토큰을 블랙리스트에 추가 (선택적)
   * @param userId 사용자 ID
   * @param expiresIn 만료 시간
   */
  async blacklistUserTokens(userId: number, expiresIn: number): Promise<void> {
    const key = `user_logout:${userId}`;

    if (this.useRedis && this.redis) {
      await this.redis.setex(key, expiresIn, new Date().toISOString());
      console.log(`[TOKEN-BLACKLIST] All tokens for user ${userId} invalidated`);
    }
    // 메모리 방식에서는 개별 토큰만 관리
  }

  /**
   * 사용자가 로그아웃했는지 확인 (선택적)
   * @param userId 사용자 ID
   * @param tokenIssuedAt 토큰 발급 시간
   */
  async isUserLoggedOut(userId: number, tokenIssuedAt: number): Promise<boolean> {
    const key = `user_logout:${userId}`;

    if (this.useRedis && this.redis) {
      const logoutTime = await this.redis.get(key);
      if (logoutTime) {
        const logoutTimestamp = new Date(logoutTime).getTime() / 1000;
        return tokenIssuedAt < logoutTimestamp;
      }
    }
    return false;
  }

  /**
   * 블랙리스트 통계 (디버깅용)
   */
  async getStats(): Promise<{ type: string; count: number }> {
    if (this.useRedis && this.redis) {
      const keys = await this.redis.keys('blacklist:*');
      return { type: 'redis', count: keys.length };
    } else {
      return { type: 'memory', count: this.memoryBlacklist.size };
    }
  }
}
