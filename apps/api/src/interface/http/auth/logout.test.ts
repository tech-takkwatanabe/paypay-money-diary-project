import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";
import { logoutHandler } from "./logout";

// Mock dependencies
const mockLogoutExecute = mock();

mock.module("@/usecase/auth/logoutUseCase", () => ({
  LogoutUseCase: class {
    execute = mockLogoutExecute;
  },
}));

mock.module("@/infrastructure/repository/tokenRepository", () => ({
  RedisTokenRepository: class {},
}));

const mockVerifyAccessToken = mock();
mock.module("@/infrastructure/auth/jwt", () => ({
  verifyAccessToken: mockVerifyAccessToken,
}));

describe("logoutHandler", () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.post("/logout", authMiddleware, logoutHandler);
    mockLogoutExecute.mockReset();
    mockVerifyAccessToken.mockReset();
  });

  it("should return 200 on successful logout", async () => {
    // Arrange
    mockVerifyAccessToken.mockReturnValue({
      userId: "uuid-123",
      email: "test@example.com",
    });
    mockLogoutExecute.mockResolvedValue(undefined);

    // Act
    const res = await app.request("/logout", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid_token",
      },
    });

    // Assert
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("message");
  });

  it("should return 401 when no authorization header", async () => {
    // Act
    const res = await app.request("/logout", {
      method: "POST",
    });

    // Assert
    expect(res.status).toBe(401);
  });

  it("should return 401 when invalid token", async () => {
    // Arrange
    mockVerifyAccessToken.mockImplementation(() => {
      throw new Error("Invalid token");
    });

    // Act
    const res = await app.request("/logout", {
      method: "POST",
      headers: {
        Authorization: "Bearer invalid_token",
      },
    });

    // Assert
    expect(res.status).toBe(401);
  });
});
