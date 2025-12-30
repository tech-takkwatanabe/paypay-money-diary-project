import { describe, it, expect, mock, spyOn, afterEach } from "bun:test";
import { RedisTokenRepository } from "./tokenRepository";
import { redis } from "@/infrastructure/redis/client";

describe("RedisTokenRepository", () => {
  const repository = new RedisTokenRepository();
  const userId = "user-123";
  const token = "refresh-token-val";

  afterEach(() => {
    mock.restore();
  });

  describe("saveRefreshToken", () => {
    it("should save token with expiration and handle old token", async () => {
      const getSpy = spyOn(redis, "get").mockResolvedValue("old-token-val");
      const setexSpy = spyOn(redis, "setex").mockResolvedValue("OK");

      await repository.saveRefreshToken(userId, token);

      expect(getSpy).toHaveBeenCalledWith(`refresh_token:${userId}`);
      expect(setexSpy).toHaveBeenCalledWith(`old_refresh_token:${userId}`, 30, "old-token-val");
      expect(setexSpy).toHaveBeenCalledWith(`refresh_token:${userId}`, 7 * 24 * 60 * 60, token);
    });

    it("should not save old token if none exists", async () => {
      spyOn(redis, "get").mockResolvedValue(null);
      const setexSpy = spyOn(redis, "setex").mockResolvedValue("OK");

      await repository.saveRefreshToken(userId, token);

      expect(setexSpy).toHaveBeenCalledTimes(1);
      expect(setexSpy).toHaveBeenCalledWith(`refresh_token:${userId}`, 7 * 24 * 60 * 60, token);
    });
  });

  describe("findRefreshToken", () => {
    it("should return token from redis", async () => {
      spyOn(redis, "get").mockResolvedValue(token);
      const result = await repository.findRefreshToken(userId);
      expect(result).toBe(token);
    });
  });

  describe("deleteRefreshToken", () => {
    it("should delete both current and old tokens", async () => {
      const delSpy = spyOn(redis, "del").mockResolvedValue(1);
      await repository.deleteRefreshToken(userId);
      expect(delSpy).toHaveBeenCalledWith(`refresh_token:${userId}`);
      expect(delSpy).toHaveBeenCalledWith(`old_refresh_token:${userId}`);
    });
  });
});
