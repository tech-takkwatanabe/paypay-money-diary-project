import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";
import { meHandler } from "./me";

// Mock dependencies
const mockGetMeExecute = mock();

mock.module("@/usecase/auth/getMeUseCase", () => ({
  GetMeUseCase: class {
    execute = mockGetMeExecute;
  },
}));

mock.module("@/infrastructure/repository/userRepository", () => ({
  UserRepository: class {},
}));

const mockVerifyAccessToken = mock();
mock.module("@/infrastructure/auth/jwt", () => ({
  verifyAccessToken: mockVerifyAccessToken,
}));

describe("meHandler", () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.get("/me", authMiddleware, meHandler);
    mockGetMeExecute.mockReset();
    mockVerifyAccessToken.mockReset();
  });

  it("should return 200 with user data when authenticated", async () => {
    // Arrange
    const mockUser = {
      id: "uuid-123",
      name: "Test User",
      email: "test@example.com",
    };
    mockVerifyAccessToken.mockReturnValue({
      userId: "uuid-123",
      email: "test@example.com",
    });
    mockGetMeExecute.mockResolvedValue(mockUser);

    // Act
    const res = await app.request("/me", {
      method: "GET",
      headers: {
        Authorization: "Bearer valid_token",
      },
    });

    // Assert
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual(mockUser);
  });

  it("should return 401 when no authorization header", async () => {
    // Act
    const res = await app.request("/me", {
      method: "GET",
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
    const res = await app.request("/me", {
      method: "GET",
      headers: {
        Authorization: "Bearer invalid_token",
      },
    });

    // Assert
    expect(res.status).toBe(401);
  });
});
