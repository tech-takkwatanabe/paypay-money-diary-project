import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '@/infrastructure/auth/jwt';
import { IUserRepository } from '@/domain/repository/userRepository';
import { ITokenRepository } from '@/domain/repository/tokenRepository';

interface RefreshResponse {
	accessToken: string;
	refreshToken: string;
}

export class RefreshUseCase {
	constructor(
		private userRepository: IUserRepository,
		private tokenRepository: ITokenRepository
	) {}

	async execute(currentRefreshToken: string): Promise<RefreshResponse> {
		// 1. Verify JWT signature and expiration
		const payload = verifyRefreshToken(currentRefreshToken);

		// 2. Check if token exists in repository and matches
		const [storedToken, oldStoredToken] = await Promise.all([this.tokenRepository.findRefreshToken(payload.userId), this.tokenRepository.findOldRefreshToken(payload.userId)]);

		// ケース1: 現在の有効なトークンと一致する場合 -> 通常のローテーション
		if (storedToken && storedToken === currentRefreshToken) {
			// 3. Generate new tokens
			const newAccessToken = generateAccessToken({
				userId: payload.userId,
				email: payload.email,
			});

			const newRefreshToken = generateRefreshToken({
				userId: payload.userId,
				email: payload.email,
			});

			// 4. Update repository with new refresh token (rotate)
			await this.tokenRepository.saveRefreshToken(payload.userId, newRefreshToken);

			return {
				accessToken: newAccessToken,
				refreshToken: newRefreshToken,
			};
		}

		// ケース2: 猶予期間中の古いトークンと一致する場合 -> 現在の有効なトークンを返す（再ローテーションしない）
		if (oldStoredToken && oldStoredToken === currentRefreshToken && storedToken) {
			const newAccessToken = generateAccessToken({
				userId: payload.userId,
				email: payload.email,
			});

			return {
				accessToken: newAccessToken,
				refreshToken: storedToken, // 現在の有効なトークンをそのまま返す
			};
		}

		// ケース3: どちらにも一致しない場合 -> 無効なトークン
		// セキュリティのため、ここではトークンを削除せず、単にエラーを投げる（誤検知によるログアウトを防ぐ）
		throw new Error('Invalid refresh token');
	}
}
