import { describe, it, expect, mock, beforeEach, afterEach, spyOn } from "bun:test";
import { Context } from "hono";
import { setAuthCookies, clearAuthCookies, getAccessTokenFromCookie, getRefreshTokenFromCookie } from "./cookie";
import * as honoCookie from "hono/cookie";

describe("Cookie Infrastructure", () => {
  let mockContext: Context;

  beforeEach(() => {
    mockContext = {
      header: mock(),
      req: {
        raw: {
          headers: new Headers(),
        },
      },
    } as unknown as Context;
  });

  afterEach(() => {
    mock.restore();
  });

  describe("setAuthCookies", () => {
    it("should call setCookie with correct options", () => {
      const setCookieSpy = spyOn(honoCookie, "setCookie").mockImplementation(() => {});
      const accessToken = "access-token-123";
      const refreshToken = "refresh-token-456";

      setAuthCookies(mockContext, accessToken, refreshToken);

      expect(setCookieSpy).toHaveBeenCalledTimes(2);

      // Access Token check
      expect(setCookieSpy).toHaveBeenCalledWith(
        mockContext,
        "accessToken",
        accessToken,
        expect.objectContaining({
          path: "/api",
          httpOnly: true,
          secure: true,
        })
      );

      // Refresh Token check
      expect(setCookieSpy).toHaveBeenCalledWith(
        mockContext,
        "refreshToken",
        refreshToken,
        expect.objectContaining({
          path: "/api/auth",
          httpOnly: true,
          secure: true,
        })
      );
    });
  });

  describe("clearAuthCookies", () => {
    it("should call deleteCookie with correct paths", () => {
      const deleteCookieSpy = spyOn(honoCookie, "deleteCookie").mockImplementation(() => undefined);

      clearAuthCookies(mockContext);

      expect(deleteCookieSpy).toHaveBeenCalledTimes(2);
      expect(deleteCookieSpy).toHaveBeenCalledWith(
        mockContext,
        "accessToken",
        expect.objectContaining({ path: "/api" })
      );
      expect(deleteCookieSpy).toHaveBeenCalledWith(
        mockContext,
        "refreshToken",
        expect.objectContaining({ path: "/api/auth" })
      );
    });
  });

  describe("getAccessTokenFromCookie", () => {
    it("should call getCookie with accessToken key", () => {
      const getCookieSpy = spyOn(honoCookie, "getCookie").mockReturnValue("token-val");

      const result = getAccessTokenFromCookie(mockContext);

      expect(getCookieSpy).toHaveBeenCalledWith(mockContext, "accessToken");
      expect(result).toBe("token-val");
    });
  });

  describe("getRefreshTokenFromCookie", () => {
    it("should call getCookie with refreshToken key", () => {
      const getCookieSpy = spyOn(honoCookie, "getCookie").mockReturnValue("refresh-val");

      const result = getRefreshTokenFromCookie(mockContext);

      expect(getCookieSpy).toHaveBeenCalledWith(mockContext, "refreshToken");
      expect(result).toBe("refresh-val");
    });
  });
});
