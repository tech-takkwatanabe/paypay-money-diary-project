import { describe, it, expect, mock, beforeEach, Mock, spyOn, afterEach } from "bun:test";
import { Context } from "hono";
import * as jwt from "@/infrastructure/auth/jwt";
import * as cookie from "@/infrastructure/auth/cookie";
import { authMiddleware } from "./auth";

describe("authMiddleware", () => {
  let mockContext: Context;
  let mockNext: () => Promise<void>;

  afterEach(() => {
    mock.restore();
  });

  beforeEach(() => {
    mockNext = mock(() => Promise.resolve());
    mockContext = {
      get: mock(),
      set: mock(),
      req: {
        header: mock(),
      },
      json: mock((data: unknown, status: number) => ({ data, status })),
    } as unknown as Context;
  });

  it("should call next() if valid token is provided in cookie", async () => {
    // Arrange
    const payload = { userId: "user-123", email: "test@example.com" };
    const spyGetCookie = spyOn(cookie, "getAccessTokenFromCookie").mockReturnValue("valid-token");
    const spyVerify = spyOn(jwt, "verifyAccessToken").mockReturnValue(payload);

    // Act
    await authMiddleware(mockContext, mockNext);

    // Assert
    expect(mockContext.set).toHaveBeenCalledWith("user", payload);
    expect(mockNext).toHaveBeenCalled();
    expect(spyGetCookie).toHaveBeenCalled();
    expect(spyVerify).toHaveBeenCalled();
  });

  it("should call next() if valid token is provided in Authorization header", async () => {
    // Arrange
    const payload = { userId: "user-123", email: "test@example.com" };
    spyOn(cookie, "getAccessTokenFromCookie").mockReturnValue(undefined);
    (mockContext.req.header as unknown as Mock<() => string | undefined>).mockReturnValue("Bearer valid-header-token");
    const spyVerify = spyOn(jwt, "verifyAccessToken").mockReturnValue(payload);

    // Act
    await authMiddleware(mockContext, mockNext);

    // Assert
    expect(mockContext.set).toHaveBeenCalledWith("user", payload);
    expect(mockNext).toHaveBeenCalled();
    expect(spyVerify).toHaveBeenCalled();
  });

  it("should return 401 if no token is provided", async () => {
    // Arrange
    spyOn(cookie, "getAccessTokenFromCookie").mockReturnValue(undefined);
    (mockContext.req.header as unknown as Mock<() => string | undefined>).mockReturnValue(undefined);

    // Act
    await authMiddleware(mockContext, mockNext);

    // Assert
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockContext.json).toHaveBeenCalledWith({ error: "Unauthorized" }, 401);
  });

  it("should return 401 if token is invalid", async () => {
    // Arrange
    spyOn(cookie, "getAccessTokenFromCookie").mockReturnValue("invalid-token");
    spyOn(jwt, "verifyAccessToken").mockImplementation(() => {
      throw new Error("Invalid token");
    });

    // Act
    await authMiddleware(mockContext, mockNext);

    // Assert
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockContext.json).toHaveBeenCalledWith({ error: "Unauthorized" }, 401);
  });
});
