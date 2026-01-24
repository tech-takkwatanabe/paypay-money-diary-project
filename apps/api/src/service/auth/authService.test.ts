import { describe, it, expect, beforeEach, mock, type Mock } from "bun:test";
import { AuthService } from "./authService";
import { User } from "@/domain/entity/user";
import { Email, Password } from "@paypay-money-diary/shared";
import type { IUserRepository } from "@/domain/repository/userRepository";
import { PasswordService } from "./passwordService";

describe("AuthService", () => {
  let authService: AuthService;
  let findByEmailMock: Mock<(email: string) => Promise<User | null>>;
  let verifyPasswordMock: Mock<(password: string, hashedPassword: string) => Promise<boolean>>;

  const testUser = new User(
    "user-123",
    "Test User",
    Email.create("test@example.com"),
    Password.create("hashed-password"),
    new Date(),
    new Date()
  );

  beforeEach(() => {
    findByEmailMock = mock(async (_email: string) => testUser);
    verifyPasswordMock = mock(async (_password: string, _hashedPassword: string) => true);

    const mockUserRepository = {
      findByEmail: findByEmailMock,
      findById: mock(async (_id: string) => testUser),
      create: mock(async () => testUser),
      delete: mock(async (_id: string) => {}),
    } as IUserRepository;

    const mockPasswordService = {
      verifyPassword: verifyPasswordMock,
      hashPassword: mock(async (_password: string) => "hashed-password"),
    } as PasswordService;

    authService = new AuthService(mockUserRepository, mockPasswordService);
  });

  describe("authenticateUser", () => {
    it("should authenticate user with valid credentials", async () => {
      // Arrange
      const email = "test@example.com";
      const password = "correct-password";

      // Act
      const user = await authService.authenticateUser(email, password);

      // Assert
      expect(user).toBeDefined();
      expect(user.id).toBe(testUser.id);
      expect(findByEmailMock).toHaveBeenCalledWith(email);
      expect(verifyPasswordMock).toHaveBeenCalledWith(password, testUser.password.value);
    });

    it("should throw error for non-existent user", async () => {
      // Arrange
      const email = "nonexistent@example.com";
      const password = "any-password";

      findByEmailMock.mockImplementation(async () => null);

      // Act & Assert
      expect(authService.authenticateUser(email, password)).rejects.toThrow("Invalid credentials");
      expect(findByEmailMock).toHaveBeenCalledWith(email);
    });

    it("should throw error for incorrect password", async () => {
      // Arrange
      const email = "test@example.com";
      const password = "wrong-password";

      verifyPasswordMock.mockImplementation(async () => false);

      // Act & Assert
      expect(authService.authenticateUser(email, password)).rejects.toThrow("Invalid credentials");
      expect(verifyPasswordMock).toHaveBeenCalledWith(password, testUser.password.value);
    });
  });

  describe("checkUserExists", () => {
    it("should return true if user exists", async () => {
      // Arrange
      const email = "existing@example.com";

      // Act
      const exists = await authService.checkUserExists(email);

      // Assert
      expect(exists).toBe(true);
      expect(findByEmailMock).toHaveBeenCalledWith(email);
    });

    it("should return false if user does not exist", async () => {
      // Arrange
      const email = "nonexistent@example.com";
      findByEmailMock.mockImplementation(async () => null);

      // Act
      const exists = await authService.checkUserExists(email);

      // Assert
      expect(exists).toBe(false);
      expect(findByEmailMock).toHaveBeenCalledWith(email);
    });
  });
});
