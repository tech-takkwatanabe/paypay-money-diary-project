import { describe, it, expect, mock, beforeEach, type Mock } from "bun:test";
import { ITokenRepository } from "@/domain/repository/tokenRepository";
import { LoginInput, Email, Password } from "@paypay-money-diary/shared";
import { User } from "@/domain/entity/user";
import { AuthService } from "@/service/auth/authService";
import { TokenService } from "@/service/auth/tokenService";
import { LoginUseCase } from "./loginUseCase";

// Mock Services
const mockAuthService = {
  authenticateUser: mock() as Mock<AuthService["authenticateUser"]>,
} as unknown as AuthService;

const mockTokenService = {
  generateTokenPair: mock() as Mock<TokenService["generateTokenPair"]>,
} as unknown as TokenService;

// Mock ITokenRepository
const mockTokenRepository = {
  saveRefreshToken: mock() as Mock<ITokenRepository["saveRefreshToken"]>,
} as unknown as ITokenRepository;

describe("LoginUseCase", () => {
  let loginUseCase: LoginUseCase;

  beforeEach(() => {
    loginUseCase = new LoginUseCase(mockAuthService, mockTokenService, mockTokenRepository);
    (mockAuthService.authenticateUser as Mock<AuthService["authenticateUser"]>).mockClear();
    (mockTokenService.generateTokenPair as Mock<TokenService["generateTokenPair"]>).mockClear();
    (mockTokenRepository.saveRefreshToken as Mock<ITokenRepository["saveRefreshToken"]>).mockClear();
  });

  it("should login successfully with valid credentials", async () => {
    // Arrange
    const input: LoginInput = {
      email: "test@example.com",
      password: "password123",
    };

    const mockUser = new User("uuid-123", "Test User", Email.create(input.email), Password.create("hashed_password"));

    (mockAuthService.authenticateUser as Mock<AuthService["authenticateUser"]>).mockResolvedValue(mockUser);
    (mockTokenService.generateTokenPair as Mock<TokenService["generateTokenPair"]>).mockReturnValue({
      accessToken: "mock_access_token",
      refreshToken: "mock_refresh_token",
    });
    (mockTokenRepository.saveRefreshToken as Mock<ITokenRepository["saveRefreshToken"]>).mockResolvedValue(undefined);

    // Act
    const result = await loginUseCase.execute(input);

    // Assert
    expect(mockAuthService.authenticateUser).toHaveBeenCalledWith(input.email, input.password);
    expect(mockTokenService.generateTokenPair).toHaveBeenCalledWith({
      userId: mockUser.id,
      email: mockUser.email.toString(),
    });
    expect(mockTokenRepository.saveRefreshToken).toHaveBeenCalledWith(mockUser.id, "mock_refresh_token");
    expect(result).toEqual({
      accessToken: "mock_access_token",
      refreshToken: "mock_refresh_token",
      user: mockUser,
    });
  });

  it("should throw error if authentication fails", async () => {
    // Arrange
    const input: LoginInput = {
      email: "test@example.com",
      password: "wrong_password",
    };

    (mockAuthService.authenticateUser as Mock<AuthService["authenticateUser"]>).mockRejectedValue(
      new Error("Invalid credentials")
    );

    // Act & Assert
    await expect(loginUseCase.execute(input)).rejects.toThrow("Invalid credentials");
    expect(mockAuthService.authenticateUser).toHaveBeenCalledWith(input.email, input.password);
    expect(mockTokenService.generateTokenPair).not.toHaveBeenCalled();
  });
});
