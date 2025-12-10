/**
 * Custom fetch function for API calls
 * Handles authentication and base URL
 */

const getBaseUrl = () => {
	// Use environment variable or default to localhost
	return process.env.NEXT_PUBLIC_API_URL || 'https://localhost:8080/api';
};

const getAuthToken = () => {
	if (typeof window === 'undefined') return null;
	return localStorage.getItem('accessToken');
};

export const customFetch = async <T>(url: string, options?: RequestInit): Promise<T> => {
	const baseUrl = getBaseUrl();
	const fullUrl = `${baseUrl}${url}`;

	// Build headers
	const headers: HeadersInit = {
		...options?.headers,
	};

	// Add auth token if available
	const token = getAuthToken();
	if (token) {
		(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
	}

	const response = await fetch(fullUrl, {
		...options,
		headers,
	});

	// Handle 401 - token expired
	if (response.status === 401) {
		// TODO: Implement token refresh logic
		// For now, redirect to login
		if (typeof window !== 'undefined') {
			localStorage.removeItem('accessToken');
			localStorage.removeItem('refreshToken');
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
