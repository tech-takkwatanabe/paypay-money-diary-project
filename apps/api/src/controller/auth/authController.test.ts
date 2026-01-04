import { describe, it, expect, mock, beforeEach, spyOn, afterEach } from "bun:test";
import { OpenAPIHono } from "@hono/zod-openapi";
import { type Context, type Next } from "hono";
import { registerAuthRoutes } from "./auth.routes";
import { Email, Password } from "@paypay-money-diary/shared";
import { User } from "@/domain/entity/user";

import { LoginUseCase } from "@/usecase/auth/loginUseCase";
import { SignupUseCase } from "@/usecase/auth/signupUseCase";
import { GetMeUseCase } from "@/usecase/auth/getMeUseCase";
import { RefreshUseCase } from "@/usecase/auth/refreshUseCase";
import { LogoutUseCase } from "@/usecase/auth/logoutUseCase";
import * as cookieUtils from "@/infrastructure/auth/cookie";

// Mock middleware
const authMiddleware = async (c: Context, next: Next) => {
  c.set("user", { userId: "uuid-123", email: "test@example.com" });
  await next();
};

describe("AuthController", () => {
  let app: OpenAPIHono;

  // Spies
  let loginSpy: ReturnType<typeof spyOn>;
  let signupSpy: ReturnType<typeof spyOn>;
  let getMeSpy: ReturnType<typeof spyOn>;
  let refreshSpy: ReturnType<typeof spyOn>;
  let logoutSpy: ReturnType<typeof spyOn>;
  let setAuthCookiesSpy: ReturnType<typeof spyOn>;
  let clearAuthCookiesSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    app = new OpenAPIHono();
    // Register middleware for protected routes
    app.use("/auth/logout", authMiddleware);
    app.use("/auth/me", authMiddleware);
    registerAuthRoutes(app);

    loginSpy = spyOn(LoginUseCase.prototype, "execute");
    signupSpy = spyOn(SignupUseCase.prototype, "execute");
    getMeSpy = spyOn(GetMeUseCase.prototype, "execute");
    refreshSpy = spyOn(RefreshUseCase.prototype, "execute");
    logoutSpy = spyOn(LogoutUseCase.prototype, "execute");
    setAuthCookiesSpy = spyOn(cookieUtils, "setAuthCookies");
    clearAuthCookiesSpy = spyOn(cookieUtils, "clearAuthCookies");
  });

  afterEach(() => {
    mock.restore();
  });

  describe("POST /auth/signup", () => {
    it("should return 201 on successful signup", async () => {
      const mockUser = new User(
        "uuid-123",
        "Test User",
        Email.create("test@example.com"),
        Password.create("hashed_password")
      );
      signupSpy.mockResolvedValue(mockUser);

      const res = await app.request("/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test User",
          email: "test@example.com",
          password: "password123",
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data).toEqual(mockUser.toResponse());
    });

    it("should return 409 if user already exists", async () => {
      signupSpy.mockRejectedValue(new Error("User already exists"));

      const res = await app.request("/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test User",
          email: "test@example.com",
          password: "password123",
        }),
      });

      expect(res.status).toBe(409);
    });
  });

  describe("POST /auth/login", () => {
    it("should return 200 and set cookies on successful login", async () => {
      const mockUser = new User(
        "uuid-123",
        "Test User",
        Email.create("test@example.com"),
        Password.create("hashed_password")
      );
      loginSpy.mockResolvedValue({
        accessToken: "access_token",
        refreshToken: "refresh_token",
        user: mockUser,
      });

      const res = await app.request("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123",
        }),
      });

      expect(res.status).toBe(200);
      expect(setAuthCookiesSpy).toHaveBeenCalled();
      const data = await res.json();
      expect(data.user).toEqual(mockUser.toResponse());
    });

    it("should return 401 on invalid credentials", async () => {
      loginSpy.mockRejectedValue(new Error("Invalid credentials"));

      const res = await app.request("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
          password: "wrong_password",
        }),
      });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /auth/me", () => {
    it("should return 200 with user data", async () => {
      const mockUser = new User(
        "uuid-123",
        "Test User",
        Email.create("test@example.com"),
        Password.create("hashed_password")
      );
      getMeSpy.mockResolvedValue(mockUser);

      const res = await app.request("/auth/me");

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual(mockUser.toResponse());
    });
  });

  describe("POST /auth/refresh", () => {
    it("should return 200 on successful refresh", async () => {
      refreshSpy.mockResolvedValue({
        accessToken: "new_access_token",
        refreshToken: "new_refresh_token",
      });

      const res = await app.request("/auth/refresh", {
        method: "POST",
        headers: {
          Cookie: "refreshToken=old_refresh_token",
        },
      });

      expect(res.status).toBe(200);
      expect(setAuthCookiesSpy).toHaveBeenCalled();
    });

    it("should return 401 if refresh token is missing", async () => {
      const res = await app.request("/auth/refresh", {
        method: "POST",
      });

      expect(res.status).toBe(401);
    });
  });

  describe("POST /auth/logout", () => {
    it("should return 200 and clear cookies on successful logout", async () => {
      logoutSpy.mockResolvedValue(undefined);

      const res = await app.request("/auth/logout", {
        method: "POST",
      });

      expect(res.status).toBe(200);
      expect(clearAuthCookiesSpy).toHaveBeenCalled();
      expect(logoutSpy).toHaveBeenCalledWith("uuid-123");
    });
  });
});
