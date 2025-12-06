import { redis } from "@/infrastructure/redis/client";
import { ITokenRepository } from "@/domain/repository/tokenRepository";

export class RedisTokenRepository implements ITokenRepository {
  private readonly EXPIRATION_SECONDS = 7 * 24 * 60 * 60; // 7 days

  async saveRefreshToken(userId: string, token: string): Promise<void> {
    const key = this.getKey(userId);
    await redis.setex(key, this.EXPIRATION_SECONDS, token);
  }

  async findRefreshToken(userId: string): Promise<string | null> {
    const key = this.getKey(userId);
    return await redis.get(key);
  }

  async deleteRefreshToken(userId: string): Promise<void> {
    const key = this.getKey(userId);
    await redis.del(key);
  }

  private getKey(userId: string): string {
    return `refresh_token:${userId}`;
  }
}
