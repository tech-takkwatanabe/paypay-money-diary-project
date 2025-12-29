import { describe, it, expect, mock, spyOn, afterEach } from "bun:test";
import { app } from "@/index";
import { SignupUseCase } from "@/usecase/auth/signupUseCase";
import { LoginUseCase } from "@/usecase/auth/loginUseCase";
import { RefreshUseCase } from "@/usecase/auth/refreshUseCase";
import { GetMeUseCase } from "@/usecase/auth/getMeUseCase";
import { LogoutUseCase } from "@/usecase/auth/logoutUseCase";
import jwt from "jsonwebtoken";

// Set test environment variables
process.env.JWT_ACCESS_SECRET = "test-secret";
process.env.JWT_ACCESS_EXPIRES_IN = "15m";

describe("Auth Routes", () => {
  const testUser = { userId: "user-123", email: "test@example.com" };
  const testToken = jwt.sign(testUser, process.env.JWT_ACCESS_SECRET!);

  afterEach(() => {
    mock.restore();
  });

  describe("POST /api/auth/signup", () => {
    it("should route to signupHandler and call SignupUseCase", async () => {
      const mockResponse = { id: "user-123", name: "Test User", email: "test@example.com" };
      const spy = spyOn(SignupUseCase.prototype, "execute").mockResolvedValue(mockResponse);

      const res = await app.request("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test User",
          email: "test@example.com",
          password: "password123",
        }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body).toEqual(mockResponse);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("POST /api/auth/login", () => {
    it("should route to loginHandler and call LoginUseCase", async () => {
      const mockResponse = {
        accessToken: "access",
        refreshToken: "refresh",
        user: { id: "user-123", name: "Test User", email: "test@example.com" },
      };
      const spy = spyOn(LoginUseCase.prototype, "execute").mockResolvedValue(mockResponse);

      const res = await app.request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123",
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.user).toEqual(mockResponse.user);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("should route to refreshHandler and call RefreshUseCase", async () => {
      const mockResponse = { accessToken: "new-access", refreshToken: "new-refresh" };
      const spy = spyOn(RefreshUseCase.prototype, "execute").mockResolvedValue(mockResponse);

      const res = await app.request("/api/auth/refresh", {
        method: "POST",
        headers: {
          Cookie: "refreshToken=valid-refresh-token",
        },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.message).toBe("Token refreshed successfully");
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("GET /api/auth/me", () => {
    it("should route to meHandler and call GetMeUseCase", async () => {
      const mockResponse = { id: "user-123", name: "Test User", email: "test@example.com" };
      const spy = spyOn(GetMeUseCase.prototype, "execute").mockResolvedValue(mockResponse);

      const res = await app.request("/api/auth/me", {
        method: "GET",
        headers: {
          Cookie: `accessToken=${testToken}`,
        },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual(mockResponse);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should route to logoutHandler and call LogoutUseCase", async () => {
      const spy = spyOn(LogoutUseCase.prototype, "execute").mockResolvedValue(undefined);

      const res = await app.request("/api/auth/logout", {
        method: "POST",
        headers: {
          Cookie: `accessToken=${testToken}`,
        },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.message).toBe("Logged out successfully");
      expect(spy).toHaveBeenCalled();
    });
  });
});
