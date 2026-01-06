import { describe, it, expect, beforeEach } from "bun:test";
import { AuthService } from "./authService";
import { User } from "@/domain/entity/user";
import { Email, Password, CreateUserInput } from "@paypay-money-diary/shared";
import type { IUserRepository } from "@/domain/repository/userRepository";

type MockUserRepository = IUserRepository;

interface MockPasswordService {
  verifyPassword: (password: string, hashedPassword: string) => Promise<boolean>;
  hashPassword: (password: string) => Promise<string>;
}

describe("AuthService", () => {
  let authService: AuthService;
  let mockUserRepository: MockUserRepository;
  let mockPasswordService: MockPasswordService;

  const testUser = new User(
    "user-123",
    "Test User",
    Email.create("test@example.com"),
    Password.create("hashed-password"),
    new Date(),
    new Date()
  );

  beforeEach(() => {
    // Initialize mocks with proper types
    mockUserRepository = {
      findByEmail: async (_email: string) => testUser,
      findById: async (_id: string) => testUser,
      create: async (_input: CreateUserInput & { passwordHash: string; uuid: string }) => testUser,
    };
    
    mockPasswordService = {
      verifyPassword: async (_password: string, _hashedPassword: string) => true,
      hashPassword: async (_password: string) => 'hashed-password',
    };

    authService = new AuthService(mockUserRepository, mockPasswordService);
  });

  describe("authenticateUser", () => {
    it("should authenticate user with valid credentials", async () => {
      // Arrange
      const email = "test@example.com";
      const password = "correct-password";

      mockUserRepository.findByEmail = async (_email: string) => testUser;
      mockPasswordService.verifyPassword = async (_password: string, _hashedPassword: string) => true;

      // Act
      const user = await authService.authenticateUser(email, password);

      // Assert
      expect(user).toBeDefined();
      expect(user.id).toBe(testUser.id);
    });

    it("should throw error for non-existent user", async () => {
      // Arrange
      const email = "nonexistent@example.com";
      const password = "any-password";

      mockUserRepository.findByEmail = async () => null;

      // Act & Assert
      await expect(authService.authenticateUser(email, password)).rejects.toThrow("Invalid credentials");
    });

    it("should throw error for incorrect password", async () => {
      // Arrange
      const email = "test@example.com";
      const password = "wrong-password";
      
      mockUserRepository.findByEmail = async () => testUser;
      mockPasswordService.verifyPassword = async () => false;

      // Act & Assert
      await expect(authService.authenticateUser(email, password)).rejects.toThrow("Invalid credentials");
    });
  });

  describe("checkUserExists", () => {
    it("should return true if user exists", async () => {
      // Arrange
      const email = "existing@example.com";
      mockUserRepository.findByEmail = async () => testUser;

      // Act
      const exists = await authService.checkUserExists(email);

      // Assert
      expect(exists).toBe(true);
    });

    it("should return false if user does not exist", async () => {
      // Arrange
      const email = "nonexistent@example.com";
      mockUserRepository.findByEmail = async () => null;

      // Act
      const exists = await authService.checkUserExists(email);

      // Assert
      expect(exists).toBe(false);
    });
  });
});
