/**
 * Custom fetch function for API calls
 * HttpOnly Cookie 認証対応
 */

const getBaseUrl = () => {
	return process.env.NEXT_PUBLIC_API_URL || 'https://localhost:8080/api';
};

export const customFetch = async <T>(url: string, options?: RequestInit): Promise<T> => {
	const baseUrl = getBaseUrl();
	const fullUrl = `${baseUrl}${url}`;

	const response = await fetch(fullUrl, {
		...options,
		credentials: 'include', // Cookie を送信
	});

	// Handle 401 - token expired
	if (response.status === 401) {
		// トークンリフレッシュを試行
		const refreshResponse = await fetch(`${baseUrl}/auth/refresh`, {
			method: 'POST',
			credentials: 'include',
		});

		if (refreshResponse.ok) {
			// リフレッシュ成功 → 元のリクエストを再試行
			const retryResponse = await fetch(fullUrl, {
				...options,
				credentials: 'include',
			});

			if (retryResponse.ok) {
				const text = await retryResponse.text();
				return text ? JSON.parse(text) : ({} as T);
			}
		}

		// リフレッシュ失敗 → ログインページへ
		if (typeof window !== 'undefined') {
			window.location.href = '/login';
		}
		throw new Error('Unauthorized');
	}

	// Parse response
	if (!response.ok) {
		const error = await response.json().catch(() => ({ error: 'Unknown error' }));
		throw new Error(error.error || `HTTP ${response.status}`);
	}

	// Handle empty response
	const text = await response.text();
	if (!text) {
		return {} as T;
	}

	return JSON.parse(text) as T;
};

export default customFetch;
