import { describe, it, expect, beforeEach, mock, spyOn, afterEach } from "bun:test";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { LoginSchema } from "@paypay-money-diary/shared";
import { loginHandler } from "./login";
import { LoginUseCase } from "@/usecase/auth/loginUseCase";

describe("loginHandler", () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.post("/login", zValidator("json", LoginSchema), loginHandler);
  });

  afterEach(() => {
    mock.restore();
  });

  it("should return 200 with user data and set cookies on successful login", async () => {
    // Arrange
    const mockResponse = {
      accessToken: "access_token_123",
      refreshToken: "refresh_token_123",
      user: {
        id: "uuid-123",
        name: "Test User",
        email: "test@example.com",
      },
    };
    const spy = spyOn(LoginUseCase.prototype, "execute").mockResolvedValue(mockResponse);

    // Act
    const res = await app.request("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
      }),
    });

    // Assert
    expect(res.status).toBe(200);

    // レスポンスボディにはトークンを含めない（Cookie で送信）
    const data = await res.json();
    expect(data).toEqual({
      user: mockResponse.user,
    });

    // Cookie が設定されていることを確認
    const cookies = res.headers.get("set-cookie");
    expect(cookies).toContain("accessToken=");
    expect(spy).toHaveBeenCalled();
  });

  it("should return 400 on validation error", async () => {
    // Act
    const res = await app.request("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "invalid-email",
        password: "short",
      }),
    });

    // Assert
    expect(res.status).toBe(400);
  });

  it("should return 401 on invalid credentials", async () => {
    // Arrange
    spyOn(LoginUseCase.prototype, "execute").mockRejectedValue(new Error("Invalid credentials"));

    // Act
    const res = await app.request("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "wrongpassword",
      }),
    });

    // Assert
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data).toHaveProperty("error");
  });
});
