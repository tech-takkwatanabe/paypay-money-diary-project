import { describe, it, expect, mock, beforeEach, Mock } from "bun:test";
import { CreateTransactionUseCase } from "./createTransactionUsecase";
import { ITransactionRepository } from "@/domain/repository/transactionRepository";
import { ICategoryRepository } from "@/domain/repository/categoryRepository";
import { Transaction } from "@/domain/entity/transaction";
import { Category } from "@/domain/entity/category";

describe("CreateTransactionUseCase", () => {
  let useCase: CreateTransactionUseCase;
  let transactionRepository: ITransactionRepository;
  let categoryRepository: ICategoryRepository;

  beforeEach(() => {
    transactionRepository = {
      create: mock().mockResolvedValue(null),
    } as unknown as ITransactionRepository;

    categoryRepository = {
      findById: mock().mockResolvedValue(null),
    } as unknown as ICategoryRepository;

    useCase = new CreateTransactionUseCase(transactionRepository, categoryRepository);
  });

  it("should create transaction with valid input", async () => {
    // Arrange
    const userId = "user-123";
    const input = {
      date: "2024-01-15",
      amount: 1000,
      description: "Test Store",
      categoryId: "cat-1",
    };

    const mockCategory = new Category({
      id: "cat-1",
      name: "Food",
      color: "#FF0000",
      icon: "🍔",
      displayOrder: 100,
      isDefault: false,
      isOther: false,
      userId: userId,
    });

    const mockTransaction = new Transaction(
      "tx-1",
      userId,
      new Date(input.date),
      input.description,
      input.amount,
      input.categoryId,
      mockCategory.name,
      mockCategory.color,
      mockCategory.displayOrder,
      "手動",
      new Date(),
      new Date()
    );

    (categoryRepository.findById as Mock<typeof categoryRepository.findById>).mockResolvedValue(mockCategory);
    (transactionRepository.create as Mock<typeof transactionRepository.create>).mockResolvedValue(mockTransaction);

    // Act
    const result = await useCase.execute(userId, input);

    // Assert
    expect(categoryRepository.findById).toHaveBeenCalledWith(input.categoryId);
    expect(transactionRepository.create).toHaveBeenCalledWith({
      userId,
      date: new Date(input.date),
      amount: input.amount,
      description: input.description,
      categoryId: input.categoryId,
      categoryName: mockCategory.name,
      categoryColor: mockCategory.color,
      displayOrder: mockCategory.displayOrder,
      paymentMethod: "手動",
    });
    expect(result.id).toBe("tx-1");
    expect(result.amount).toBe(1000);
    expect(result.categoryName).toBe("Food");
  });

  it("should throw error when category not found", async () => {
    // Arrange
    const userId = "user-123";
    const input = {
      date: "2024-01-15",
      amount: 1000,
      description: "Test Store",
      categoryId: "non-existent-category",
    };

    (categoryRepository.findById as Mock<typeof categoryRepository.findById>).mockResolvedValue(null);

    // Act & Assert
    expect(useCase.execute(userId, input)).rejects.toThrow("Category not found");
    expect(categoryRepository.findById).toHaveBeenCalledWith(input.categoryId);
    expect(transactionRepository.create).not.toHaveBeenCalled();
  });

  it("should handle zero amount", async () => {
    // Arrange
    const userId = "user-123";
    const input = {
      date: "2024-01-15",
      amount: 0,
      description: "Free item",
      categoryId: "cat-1",
    };

    const mockCategory = new Category({
      id: "cat-1",
      name: "Food",
      color: "#FF0000",
      icon: "🍔",
      displayOrder: 100,
      isDefault: false,
      isOther: false,
      userId: userId,
    });

    const mockTransaction = new Transaction(
      "tx-1",
      userId,
      new Date(input.date),
      input.description,
      input.amount,
      input.categoryId,
      mockCategory.name,
      mockCategory.color,
      mockCategory.displayOrder,
      "手動",
      new Date(),
      new Date()
    );

    (categoryRepository.findById as Mock<typeof categoryRepository.findById>).mockResolvedValue(mockCategory);
    (transactionRepository.create as Mock<typeof transactionRepository.create>).mockResolvedValue(mockTransaction);

    // Act
    const result = await useCase.execute(userId, input);

    // Assert
    expect(result.amount).toBe(0);
    expect(transactionRepository.create).toHaveBeenCalled();
  });

  it("should handle negative amount", async () => {
    // Arrange
    const userId = "user-123";
    const input = {
      date: "2024-01-15",
      amount: -500,
      description: "Refund",
      categoryId: "cat-1",
    };

    const mockCategory = new Category({
      id: "cat-1",
      name: "Food",
      color: "#FF0000",
      icon: "🍔",
      displayOrder: 100,
      isDefault: false,
      isOther: false,
      userId: userId,
    });

    const mockTransaction = new Transaction(
      "tx-1",
      userId,
      new Date(input.date),
      input.description,
      input.amount,
      input.categoryId,
      mockCategory.name,
      mockCategory.color,
      mockCategory.displayOrder,
      "手動",
      new Date(),
      new Date()
    );

    (categoryRepository.findById as Mock<typeof categoryRepository.findById>).mockResolvedValue(mockCategory);
    (transactionRepository.create as Mock<typeof transactionRepository.create>).mockResolvedValue(mockTransaction);

    // Act
    const result = await useCase.execute(userId, input);

    // Assert
    expect(result.amount).toBe(-500);
    expect(transactionRepository.create).toHaveBeenCalled();
  });

  it("should handle very large amount", async () => {
    // Arrange
    const userId = "user-123";
    const input = {
      date: "2024-01-15",
      amount: 999999999,
      description: "Large purchase",
      categoryId: "cat-1",
    };

    const mockCategory = new Category({
      id: "cat-1",
      name: "Food",
      color: "#FF0000",
      icon: "🍔",
      displayOrder: 100,
      isDefault: false,
      isOther: false,
      userId: userId,
    });

    const mockTransaction = new Transaction(
      "tx-1",
      userId,
      new Date(input.date),
      input.description,
      input.amount,
      input.categoryId,
      mockCategory.name,
      mockCategory.color,
      mockCategory.displayOrder,
      "手動",
      new Date(),
      new Date()
    );

    (categoryRepository.findById as Mock<typeof categoryRepository.findById>).mockResolvedValue(mockCategory);
    (transactionRepository.create as Mock<typeof transactionRepository.create>).mockResolvedValue(mockTransaction);

    // Act
    const result = await useCase.execute(userId, input);

    // Assert
    expect(result.amount).toBe(999999999);
    expect(transactionRepository.create).toHaveBeenCalled();
  });

  it("should handle empty description", async () => {
    // Arrange
    const userId = "user-123";
    const input = {
      date: "2024-01-15",
      amount: 1000,
      description: "",
      categoryId: "cat-1",
    };

    const mockCategory = new Category({
      id: "cat-1",
      name: "Food",
      color: "#FF0000",
      icon: "🍔",
      displayOrder: 100,
      isDefault: false,
      isOther: false,
      userId: userId,
    });

    const mockTransaction = new Transaction(
      "tx-1",
      userId,
      new Date(input.date),
      input.description,
      input.amount,
      input.categoryId,
      mockCategory.name,
      mockCategory.color,
      mockCategory.displayOrder,
      "手動",
      new Date(),
      new Date()
    );

    (categoryRepository.findById as Mock<typeof categoryRepository.findById>).mockResolvedValue(mockCategory);
    (transactionRepository.create as Mock<typeof transactionRepository.create>).mockResolvedValue(mockTransaction);

    // Act
    const result = await useCase.execute(userId, input);

    // Assert
    expect(result.description).toBe("");
    expect(transactionRepository.create).toHaveBeenCalled();
  });

  it("should handle very long description", async () => {
    // Arrange
    const userId = "user-123";
    const longDescription = "A".repeat(1000);
    const input = {
      date: "2024-01-15",
      amount: 1000,
      description: longDescription,
      categoryId: "cat-1",
    };

    const mockCategory = new Category({
      id: "cat-1",
      name: "Food",
      color: "#FF0000",
      icon: "🍔",
      displayOrder: 100,
      isDefault: false,
      isOther: false,
      userId: userId,
    });

    const mockTransaction = new Transaction(
      "tx-1",
      userId,
      new Date(input.date),
      input.description,
      input.amount,
      input.categoryId,
      mockCategory.name,
      mockCategory.color,
      mockCategory.displayOrder,
      "手動",
      new Date(),
      new Date()
    );

    (categoryRepository.findById as Mock<typeof categoryRepository.findById>).mockResolvedValue(mockCategory);
    (transactionRepository.create as Mock<typeof transactionRepository.create>).mockResolvedValue(mockTransaction);

    // Act
    const result = await useCase.execute(userId, input);

    // Assert
    expect(result.description).toBe(longDescription);
    expect(transactionRepository.create).toHaveBeenCalled();
  });

  it("should handle special characters in description", async () => {
    // Arrange
    const userId = "user-123";
    const input = {
      date: "2024-01-15",
      amount: 1000,
      description: "Test <script>alert('xss')</script> & 特殊文字 🎉",
      categoryId: "cat-1",
    };

    const mockCategory = new Category({
      id: "cat-1",
      name: "Food",
      color: "#FF0000",
      icon: "🍔",
      displayOrder: 100,
      isDefault: false,
      isOther: false,
      userId: userId,
    });

    const mockTransaction = new Transaction(
      "tx-1",
      userId,
      new Date(input.date),
      input.description,
      input.amount,
      input.categoryId,
      mockCategory.name,
      mockCategory.color,
      mockCategory.displayOrder,
      "手動",
      new Date(),
      new Date()
    );

    (categoryRepository.findById as Mock<typeof categoryRepository.findById>).mockResolvedValue(mockCategory);
    (transactionRepository.create as Mock<typeof transactionRepository.create>).mockResolvedValue(mockTransaction);

    // Act
    const result = await useCase.execute(userId, input);

    // Assert
    expect(result.description).toBe(input.description);
    expect(transactionRepository.create).toHaveBeenCalled();
  });

  it("should handle date at year boundary", async () => {
    // Arrange
    const userId = "user-123";
    const input = {
      date: "2023-12-31",
      amount: 1000,
      description: "Year end purchase",
      categoryId: "cat-1",
    };

    const mockCategory = new Category({
      id: "cat-1",
      name: "Food",
      color: "#FF0000",
      icon: "🍔",
      displayOrder: 100,
      isDefault: false,
      isOther: false,
      userId: userId,
    });

    const mockTransaction = new Transaction(
      "tx-1",
      userId,
      new Date(input.date),
      input.description,
      input.amount,
      input.categoryId,
      mockCategory.name,
      mockCategory.color,
      mockCategory.displayOrder,
      "手動",
      new Date(),
      new Date()
    );

    (categoryRepository.findById as Mock<typeof categoryRepository.findById>).mockResolvedValue(mockCategory);
    (transactionRepository.create as Mock<typeof transactionRepository.create>).mockResolvedValue(mockTransaction);

    // Act
    const result = await useCase.execute(userId, input);

    // Assert
    expect(result.date).toBe(new Date(input.date).toISOString());
    expect(transactionRepository.create).toHaveBeenCalled();
  });

  it("should handle future date", async () => {
    // Arrange
    const userId = "user-123";
    const input = {
      date: "2099-12-31",
      amount: 1000,
      description: "Future purchase",
      categoryId: "cat-1",
    };

    const mockCategory = new Category({
      id: "cat-1",
      name: "Food",
      color: "#FF0000",
      icon: "🍔",
      displayOrder: 100,
      isDefault: false,
      isOther: false,
      userId: userId,
    });

    const mockTransaction = new Transaction(
      "tx-1",
      userId,
      new Date(input.date),
      input.description,
      input.amount,
      input.categoryId,
      mockCategory.name,
      mockCategory.color,
      mockCategory.displayOrder,
      "手動",
      new Date(),
      new Date()
    );

    (categoryRepository.findById as Mock<typeof categoryRepository.findById>).mockResolvedValue(mockCategory);
    (transactionRepository.create as Mock<typeof transactionRepository.create>).mockResolvedValue(mockTransaction);

    // Act
    const result = await useCase.execute(userId, input);

    // Assert
    expect(result.date).toBe(new Date(input.date).toISOString());
    expect(transactionRepository.create).toHaveBeenCalled();
  });

  it("should handle very old date", async () => {
    // Arrange
    const userId = "user-123";
    const input = {
      date: "1900-01-01",
      amount: 1000,
      description: "Old purchase",
      categoryId: "cat-1",
    };

    const mockCategory = new Category({
      id: "cat-1",
      name: "Food",
      color: "#FF0000",
      icon: "🍔",
      displayOrder: 100,
      isDefault: false,
      isOther: false,
      userId: userId,
    });

    const mockTransaction = new Transaction(
      "tx-1",
      userId,
      new Date(input.date),
      input.description,
      input.amount,
      input.categoryId,
      mockCategory.name,
      mockCategory.color,
      mockCategory.displayOrder,
      "手動",
      new Date(),
      new Date()
    );

    (categoryRepository.findById as Mock<typeof categoryRepository.findById>).mockResolvedValue(mockCategory);
    (transactionRepository.create as Mock<typeof transactionRepository.create>).mockResolvedValue(mockTransaction);

    // Act
    const result = await useCase.execute(userId, input);

    // Assert
    expect(result.date).toBe(new Date(input.date).toISOString());
    expect(transactionRepository.create).toHaveBeenCalled();
  });

  it("should use category properties correctly", async () => {
    // Arrange
    const userId = "user-123";
    const input = {
      date: "2024-01-15",
      amount: 1000,
      description: "Test Store",
      categoryId: "cat-special",
    };

    const mockCategory = new Category({
      id: "cat-special",
      name: "Special Category",
      color: "#00FF00",
      icon: "🎁",
      displayOrder: 999,
      isDefault: true,
      isOther: false,
      userId: userId,
    });

    const mockTransaction = new Transaction(
      "tx-1",
      userId,
      new Date(input.date),
      input.description,
      input.amount,
      input.categoryId,
      mockCategory.name,
      mockCategory.color,
      mockCategory.displayOrder,
      "手動",
      new Date(),
      new Date()
    );

    (categoryRepository.findById as Mock<typeof categoryRepository.findById>).mockResolvedValue(mockCategory);
    (transactionRepository.create as Mock<typeof transactionRepository.create>).mockResolvedValue(mockTransaction);

    // Act
    const result = await useCase.execute(userId, input);

    // Assert
    expect(transactionRepository.create).toHaveBeenCalledWith({
      userId,
      date: new Date(input.date),
      amount: input.amount,
      description: input.description,
      categoryId: input.categoryId,
      categoryName: "Special Category",
      categoryColor: "#00FF00",
      displayOrder: 999,
      paymentMethod: "手動",
    });
    expect(result.categoryName).toBe("Special Category");
    expect(result.categoryColor).toBe("#00FF00");
    expect(result.displayOrder).toBe(999);
  });

  it("should always set paymentMethod to '手動'", async () => {
    // Arrange
    const userId = "user-123";
    const input = {
      date: "2024-01-15",
      amount: 1000,
      description: "Manual transaction",
      categoryId: "cat-1",
    };

    const mockCategory = new Category({
      id: "cat-1",
      name: "Food",
      color: "#FF0000",
      icon: "🍔",
      displayOrder: 100,
      isDefault: false,
      isOther: false,
      userId: userId,
    });

    const mockTransaction = new Transaction(
      "tx-1",
      userId,
      new Date(input.date),
      input.description,
      input.amount,
      input.categoryId,
      mockCategory.name,
      mockCategory.color,
      mockCategory.displayOrder,
      "手動",
      new Date(),
      new Date()
    );

    (categoryRepository.findById as Mock<typeof categoryRepository.findById>).mockResolvedValue(mockCategory);
    (transactionRepository.create as Mock<typeof transactionRepository.create>).mockResolvedValue(mockTransaction);

    // Act
    const result = await useCase.execute(userId, input);

    // Assert
    expect(transactionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentMethod: "手動",
      })
    );
    expect(result.paymentMethod).toBe("手動");
  });

  it("should handle different user IDs", async () => {
    // Arrange
    const userId = "different-user-456";
    const input = {
      date: "2024-01-15",
      amount: 1000,
      description: "Test Store",
      categoryId: "cat-1",
    };

    const mockCategory = new Category({
      id: "cat-1",
      name: "Food",
      color: "#FF0000",
      icon: "🍔",
      displayOrder: 100,
      isDefault: false,
      isOther: false,
      userId: userId,
    });

    const mockTransaction = new Transaction(
      "tx-1",
      userId,
      new Date(input.date),
      input.description,
      input.amount,
      input.categoryId,
      mockCategory.name,
      mockCategory.color,
      mockCategory.displayOrder,
      "手動",
      new Date(),
      new Date()
    );

    (categoryRepository.findById as Mock<typeof categoryRepository.findById>).mockResolvedValue(mockCategory);
    (transactionRepository.create as Mock<typeof transactionRepository.create>).mockResolvedValue(mockTransaction);

    // Act
    const result = await useCase.execute(userId, input);

    // Assert
    expect(transactionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "different-user-456",
      })
    );
    expect(result.userId).toBe("different-user-456");
  });
});
