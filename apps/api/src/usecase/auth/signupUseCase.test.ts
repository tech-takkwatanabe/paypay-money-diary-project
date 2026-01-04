import { describe, it, expect, mock, beforeEach, type Mock } from "bun:test";
import { SignupUseCase } from "./signupUseCase";
import { IUserRepository } from "@/domain/repository/userRepository";
import { CreateUserInput, Email, Password } from "@paypay-money-diary/shared";
import { User } from "@/domain/entity/user";
import { AuthService } from "@/service/auth/authService";
import { PasswordService } from "@/service/auth/passwordService";

// Mock IUserRepository
const mockUserRepository = {
  findByEmail: mock() as Mock<IUserRepository["findByEmail"]>,
  findById: mock() as Mock<IUserRepository["findById"]>,
  create: mock() as Mock<IUserRepository["create"]>,
} satisfies IUserRepository;

// Mock Services
const mockAuthService = {
  checkUserExists: mock() as Mock<AuthService["checkUserExists"]>,
} as unknown as AuthService;

const mockPasswordService = {
  hashPassword: mock() as Mock<PasswordService["hashPassword"]>,
} as unknown as PasswordService;

describe("SignupUseCase", () => {
  let signupUseCase: SignupUseCase;

  beforeEach(() => {
    signupUseCase = new SignupUseCase(mockUserRepository, mockAuthService, mockPasswordService);
    mockUserRepository.findByEmail.mockClear();
    mockUserRepository.create.mockClear();
    (mockAuthService.checkUserExists as Mock<AuthService["checkUserExists"]>).mockClear();
    (mockPasswordService.hashPassword as Mock<PasswordService["hashPassword"]>).mockClear();
  });

  it("should create a new user successfully", async () => {
    // Arrange
    const input: CreateUserInput = {
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    };

    const mockUser = new User("uuid-123", input.name, Email.create(input.email), Password.create("hashed_password"));

    (mockAuthService.checkUserExists as Mock<AuthService["checkUserExists"]>).mockResolvedValue(false);
    (mockPasswordService.hashPassword as Mock<PasswordService["hashPassword"]>).mockResolvedValue("hashed_password");
    (mockUserRepository.create as Mock<IUserRepository["create"]>).mockResolvedValue(mockUser);

    // Act
    const result = await signupUseCase.execute(input);

    // Assert
    expect(mockAuthService.checkUserExists).toHaveBeenCalledWith(input.email);
    expect(mockPasswordService.hashPassword).toHaveBeenCalledWith(input.password);
    expect(mockUserRepository.create).toHaveBeenCalled();
    expect(result).toBe(mockUser);
  });

  it("should throw error if user already exists", async () => {
    // Arrange
    const input: CreateUserInput = {
      name: "Test User",
      email: "existing@example.com",
      password: "password123",
    };

    (mockAuthService.checkUserExists as Mock<AuthService["checkUserExists"]>).mockResolvedValue(true);

    // Act & Assert
    expect(signupUseCase.execute(input)).rejects.toThrow("User already exists");
    expect(mockAuthService.checkUserExists).toHaveBeenCalledWith(input.email);
    expect(mockUserRepository.create).not.toHaveBeenCalled();
  });
});
