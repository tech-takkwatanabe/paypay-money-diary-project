import { describe, it, expect, mock, beforeEach, type Mock } from "bun:test";
import { GetMeUseCase } from "./getMeUseCase";
import { IUserRepository } from "@/domain/repository/userRepository";
import { Email, Password } from "@paypay-money-diary/shared";
import { User } from "@/domain/entity/user";

// Mock IUserRepository
const mockUserRepository = {
  findByEmail: mock() as Mock<IUserRepository["findByEmail"]>,
  findById: mock() as Mock<IUserRepository["findById"]>,
  create: mock() as Mock<IUserRepository["create"]>,
  delete: mock() as Mock<IUserRepository["delete"]>,
} satisfies IUserRepository;

describe("GetMeUseCase", () => {
  let getMeUseCase: GetMeUseCase;

  beforeEach(() => {
    getMeUseCase = new GetMeUseCase(mockUserRepository);
    mockUserRepository.findById.mockClear();
  });

  it("should return user information successfully", async () => {
    // Arrange
    const userId = "uuid-123";
    const mockUser = new User(
      userId,
      "Test User",
      Email.create("test@example.com"),
      Password.create("hashed_password")
    );

    mockUserRepository.findById.mockResolvedValue(mockUser);

    // Act
    const result = await getMeUseCase.execute(userId);

    // Assert
    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    expect(result).toBe(mockUser);
  });

  it("should throw error if user not found", async () => {
    // Arrange
    const userId = "non-existent-uuid";
    mockUserRepository.findById.mockResolvedValue(null);

    // Act & Assert
    expect(getMeUseCase.execute(userId)).rejects.toThrow("User not found");
    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
  });
});
