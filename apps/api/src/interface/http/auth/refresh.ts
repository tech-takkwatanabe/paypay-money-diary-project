import { Context } from 'hono';
import { RefreshUseCase } from '@/usecase/auth/refreshUseCase';
import { UserRepository } from '@/infrastructure/repository/userRepository';
import { RedisTokenRepository } from '@/infrastructure/repository/tokenRepository';
import { getRefreshTokenFromCookie, setAuthCookies } from '@/infrastructure/auth/cookie';

export const refreshHandler = async (c: Context) => {
	// Cookie から refreshToken を取得
	const refreshToken = getRefreshTokenFromCookie(c);

	if (!refreshToken) {
		return c.json({ error: 'Refresh token not found' }, 400);
	}

	const userRepository = new UserRepository();
	const tokenRepository = new RedisTokenRepository();
	const refreshUseCase = new RefreshUseCase(userRepository, tokenRepository);

	try {
		const response = await refreshUseCase.execute(refreshToken);

		// 新しいトークンを Cookie に設定
		setAuthCookies(c, response.accessToken, response.refreshToken);

		// トークンはレスポンスボディに含めない
		return c.json({ message: 'Token refreshed successfully' }, 200);
	} catch (error) {
		console.error(error);
		return c.json({ error: 'Invalid refresh token' }, 401);
	}
};
