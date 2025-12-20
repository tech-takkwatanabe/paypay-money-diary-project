/**
 * Custom fetch function for API calls
 * HttpOnly Cookie 認証対応
 */

const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || "https://localhost:8080/api";
};

// 401でリダイレクトしないパス（認証チェック用）
const NO_REDIRECT_PATHS = ["/auth/me", "/auth/refresh"];

// トークンリフレッシュの重複実行を防ぐためのプロミス
let refreshPromise: Promise<boolean> | null = null;

export const customFetch = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const baseUrl = getBaseUrl();
  const fullUrl = `${baseUrl}${url}`;

  const response = await fetch(fullUrl, {
    ...options,
    credentials: "include", // Cookie を送信
  });

  // Handle 401 - token expired
  if (response.status === 401) {
    // 認証チェック系のAPIは、401でも例外を投げるだけでリダイレクトしない
    if (NO_REDIRECT_PATHS.some((path) => url.startsWith(path))) {
      const data = await response.json().catch(() => ({ error: "Unauthorized" }));
      return { status: 401, data, headers: response.headers } as T;
    }

    // すでにリフレッシュ実行中の場合は、その完了を待つ
    if (!refreshPromise) {
      refreshPromise = fetch(`${baseUrl}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      }).then((res) => {
        refreshPromise = null; // 完了したらリセット
        return res.ok;
      });
    }

    const isRefreshed = await refreshPromise;

    if (isRefreshed) {
      // リフレッシュ成功 → 元のリクエストを再試行
      const retryResponse = await fetch(fullUrl, {
        ...options,
        credentials: "include",
      });

      const text = await retryResponse.text();
      const data = text ? JSON.parse(text) : {};
      return {
        status: retryResponse.status,
        data,
        headers: retryResponse.headers,
      } as T;
    }

    // リフレッシュ失敗
    const data = await response.json().catch(() => ({ error: "Unauthorized" }));
    return { status: 401, data, headers: response.headers } as T;
  }

  // すべてのレスポンスを { status, data, headers } 形式で返す
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  return { status: response.status, data, headers: response.headers } as T;
};

export default customFetch;
