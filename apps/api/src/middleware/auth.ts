import { Context, Next } from "hono";
import { verifyAccessToken } from "@/infrastructure/auth/jwt";
import { getAccessTokenFromCookie } from "@/infrastructure/auth/cookie";

export const authMiddleware = async (c: Context, next: Next) => {
  // Cookie から accessToken を取得
  const token = getAccessTokenFromCookie(c);

  // Cookie がない場合は Authorization ヘッダーからも確認 (後方互換性)
  if (!token) {
    const authHeader = c.req.header("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const headerToken = authHeader.split(" ")[1];
      try {
        const payload = verifyAccessToken(headerToken);
        c.set("user", payload);
        await next();
        return;
      } catch (_error) {
        return c.json({ error: "Unauthorized" }, 401);
      }
    }
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const payload = verifyAccessToken(token);
    c.set("user", payload);
    await next();
  } catch (_error) {
    return c.json({ error: "Unauthorized" }, 401);
  }
};
