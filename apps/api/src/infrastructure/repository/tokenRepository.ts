import { redis } from '@/infrastructure/redis/client';
import { ITokenRepository } from '@/domain/repository/tokenRepository';

export class RedisTokenRepository implements ITokenRepository {
	private readonly EXPIRATION_SECONDS = 7 * 24 * 60 * 60; // 7 days

	async saveRefreshToken(userId: string, token: string): Promise<void> {
		const key = this.getKey(userId);
		const oldKey = this.getOldKey(userId);

		// 現在のトークンを「古いトークン」として短期間保存（猶予期間）
		const currentToken = await redis.get(key);
		if (currentToken) {
			await redis.setex(oldKey, 30, currentToken); // 30秒の猶予
		}

		await redis.setex(key, this.EXPIRATION_SECONDS, token);
	}

	async findRefreshToken(userId: string): Promise<string | null> {
		const key = this.getKey(userId);
		return await redis.get(key);
	}

	async findOldRefreshToken(userId: string): Promise<string | null> {
		const key = this.getOldKey(userId);
		return await redis.get(key);
	}

	async deleteRefreshToken(userId: string): Promise<void> {
		const key = this.getKey(userId);
		const oldKey = this.getOldKey(userId);
		await redis.del(key);
		await redis.del(oldKey);
	}

	private getKey(userId: string): string {
		return `refresh_token:${userId}`;
	}

	private getOldKey(userId: string): string {
		return `old_refresh_token:${userId}`;
	}
}
