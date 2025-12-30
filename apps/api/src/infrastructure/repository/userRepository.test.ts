import { describe, it, expect, mock, spyOn, afterEach } from "bun:test";
import { UserRepository } from "./userRepository";
import { db } from "@/db";

describe("UserRepository", () => {
  const repository = new UserRepository();
  const mockUser = {
    uuid: "user-123",
    name: "Test User",
    email: "test@example.com",
    passwordHash: "hashed-password",
  };

  afterEach(() => {
    mock.restore();
  });

  describe("findByEmail", () => {
    it("should return user if found", async () => {
      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          limit: mock().mockImplementation(() => Promise.resolve([mockUser])),
          then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve([mockUser])),
        };
        return chain as unknown as never;
      });

      const user = await repository.findByEmail("test@example.com");
      expect(user).not.toBeNull();
      expect(user?.id).toBe(mockUser.uuid);
      expect(user?.email.value).toBe(mockUser.email);
    });

    it("should return null if not found", async () => {
      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          limit: mock().mockImplementation(() => Promise.resolve([])),
          then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve([])),
        };
        return chain as unknown as never;
      });

      const user = await repository.findByEmail("none@example.com");
      expect(user).toBeNull();
    });
  });

  describe("create", () => {
    it("should insert and return new user", async () => {
      spyOn(db, "insert").mockImplementation(() => {
        const chain = {
          values: mock().mockReturnThis(),
          returning: mock().mockImplementation(() => Promise.resolve([mockUser])),
          then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve([mockUser])),
        };
        return chain as unknown as never;
      });

      const user = await repository.create({
        uuid: "user-123",
        name: "Test User",
        email: "test@example.com",
        password: "raw-password",
        passwordHash: "hashed-password",
      });

      expect(user.id).toBe(mockUser.uuid);
      expect(user.name).toBe(mockUser.name);
    });
  });
});
