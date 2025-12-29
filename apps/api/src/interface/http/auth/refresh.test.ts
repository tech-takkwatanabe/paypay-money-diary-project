import { describe, it, expect, beforeEach, mock, spyOn, afterEach } from "bun:test";
import { Hono } from "hono";
import { refreshHandler } from "./refresh";
import { RefreshUseCase } from "@/usecase/auth/refreshUseCase";

describe("refreshHandler", () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.post("/refresh", refreshHandler);
  });

  afterEach(() => {
    mock.restore();
  });

  it("should return 200 with message and set cookies on successful refresh", async () => {
    // Arrange
    const mockResponse = {
      accessToken: "new_access_token",
      refreshToken: "new_refresh_token",
    };
    const spy = spyOn(RefreshUseCase.prototype, "execute").mockResolvedValue(mockResponse);

    // Act - Cookie で refreshToken を送信
    const res = await app.request("/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: "refreshToken=old_refresh_token",
      },
    });

    // Assert
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ message: "Token refreshed successfully" });

    // 新しいトークンが Cookie に設定されていることを確認
    const cookies = res.headers.get("set-cookie");
    expect(cookies).toContain("accessToken=");
    expect(spy).toHaveBeenCalled();
  });

  it("should return 400 on missing refresh token cookie", async () => {
    // Act - Cookie なしでリクエスト
    const res = await app.request("/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    // Assert
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toHaveProperty("error");
  });

  it("should return 401 on invalid refresh token", async () => {
    // Arrange
    spyOn(RefreshUseCase.prototype, "execute").mockImplementation(() =>
      Promise.reject(new Error("Invalid refresh token"))
    );

    // Act
    const res = await app.request("/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: "refreshToken=invalid_token",
      },
    });

    // Assert
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data).toHaveProperty("error");
  });
});
