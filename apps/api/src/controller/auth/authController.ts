import { Context } from "hono";
import { getCookie } from "hono/cookie";
import { UserRepository } from "@/infrastructure/repository/userRepository";
import { RedisTokenRepository } from "@/infrastructure/repository/tokenRepository";
import { PasswordService } from "@/service/auth/passwordService";
import { TokenService } from "@/service/auth/tokenService";
import { AuthService } from "@/service/auth/authService";
import { LoginUseCase } from "@/usecase/auth/loginUseCase";
import { SignupUseCase } from "@/usecase/auth/signupUseCase";
import { GetMeUseCase } from "@/usecase/auth/getMeUseCase";
import { RefreshUseCase } from "@/usecase/auth/refreshUseCase";
import { LogoutUseCase } from "@/usecase/auth/logoutUseCase";
import { CategoryInitializationService } from "@/service/category/categoryInitializationService";
import { CreateUserInput, LoginInput } from "@paypay-money-diary/shared";
import { setAuthCookies, clearAuthCookies } from "@/infrastructure/auth/cookie";

/**
 * Auth Controller
 * 認証関連のHTTPハンドラーを実装
 */
export class AuthController {
  /**
   * サインアップハンドラー
   */
  async signup(c: Context) {
    // 依存性注入（手動）
    const userRepository = new UserRepository();
    const passwordService = new PasswordService();
    const authService = new AuthService(userRepository, passwordService);
    const categoryInitializationService = new CategoryInitializationService();
    const signupUseCase = new SignupUseCase(
      userRepository,
      authService,
      passwordService,
      categoryInitializationService
    );

    // 入力はzValidatorミドルウェアで検証済み
    const input = c.req.valid("json" as never) as CreateUserInput;

    try {
      const user = await signupUseCase.execute(input);
      // EntityをDTOに変換
      return c.json(user.toResponse(), 201);
    } catch (error) {
      if (error instanceof Error && error.message === "User already exists") {
        return c.json({ error: "User already exists" }, 409);
      }
      console.error(error);
      return c.json({ error: "Internal Server Error" }, 500);
    }
  }

  /**
   * ログインハンドラー
   */
  async login(c: Context) {
    // 依存性注入（手動）
    const userRepository = new UserRepository();
    const tokenRepository = new RedisTokenRepository();
    const passwordService = new PasswordService();
    const tokenService = new TokenService();
    const authService = new AuthService(userRepository, passwordService);
    const loginUseCase = new LoginUseCase(authService, tokenService, tokenRepository);

    // 入力はzValidatorミドルウェアで検証済み
    const input = c.req.valid("json" as never) as LoginInput;

    try {
      const result = await loginUseCase.execute(input);
      // HttpOnly Cookieを設定
      setAuthCookies(c, result.accessToken, result.refreshToken);
      // EntityをDTOに変換
      return c.json({ user: result.user.toResponse() }, 200);
    } catch (error) {
      if (error instanceof Error && error.message === "Invalid credentials") {
        return c.json({ error: "Invalid credentials" }, 401);
      }
      console.error(error);
      return c.json({ error: "Internal Server Error" }, 500);
    }
  }

  /**
   * 現在のユーザー情報取得ハンドラー
   */
  async getMe(c: Context) {
    const userPayload = c.get("user");

    if (!userPayload || !userPayload.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // 依存性注入（手動）
    const userRepository = new UserRepository();
    const getMeUseCase = new GetMeUseCase(userRepository);

    try {
      const user = await getMeUseCase.execute(userPayload.userId);
      // EntityをDTOに変換
      return c.json(user.toResponse(), 200);
    } catch (error) {
      console.error(error);
      return c.json({ error: "Internal Server Error" }, 500);
    }
  }

  /**
   * トークン更新ハンドラー
   */
  async refresh(c: Context) {
    const refreshToken = getCookie(c, "refreshToken");

    if (!refreshToken) {
      return c.json({ error: "Refresh token not found" }, 401);
    }

    // 依存性注入（手動）
    const tokenRepository = new RedisTokenRepository();
    const tokenService = new TokenService();
    const refreshUseCase = new RefreshUseCase(tokenRepository, tokenService);

    try {
      const result = await refreshUseCase.execute(refreshToken);
      // HttpOnly Cookieを設定
      setAuthCookies(c, result.accessToken, result.refreshToken);
      return c.json({ message: "Token refreshed successfully" }, 200);
    } catch (error) {
      if (error instanceof Error && error.message === "Invalid refresh token") {
        return c.json({ error: "Invalid refresh token" }, 401);
      }
      console.error(error);
      return c.json({ error: "Internal Server Error" }, 500);
    }
  }

  /**
   * ログアウトハンドラー
   */
  async logout(c: Context) {
    const userPayload = c.get("user");

    if (!userPayload || !userPayload.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // 依存性注入（手動）
    const tokenRepository = new RedisTokenRepository();
    const logoutUseCase = new LogoutUseCase(tokenRepository);

    try {
      await logoutUseCase.execute(userPayload.userId);
      // Cookieをクリア
      clearAuthCookies(c);
      return c.json({ message: "Logged out successfully" }, 200);
    } catch (error) {
      console.error(error);
      return c.json({ error: "Internal Server Error" }, 500);
    }
  }
}
