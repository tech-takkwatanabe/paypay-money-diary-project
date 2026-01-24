import { describe, it, expect, beforeEach, mock, Mock } from "bun:test";
import { CategoryInitializationService } from "./categoryInitializationService";
import { ICategoryRepository } from "@/domain/repository/categoryRepository";
import { IRuleRepository } from "@/domain/repository/ruleRepository";
import { IDefaultCategoryRepository } from "@/domain/repository/defaultCategoryRepository";
import { IDefaultCategoryRuleRepository } from "@/domain/repository/defaultCategoryRuleRepository";
import { Category } from "@/domain/entity/category";
import { Rule } from "@/domain/entity/rule";
import { CreateCategoryInput, CreateRuleInput } from "@paypay-money-diary/shared";

describe("CategoryInitializationService", () => {
  let service: CategoryInitializationService;
  let mockCategoryRepository: ICategoryRepository;
  let mockRuleRepository: IRuleRepository;
  let mockDefaultCategoryRepository: IDefaultCategoryRepository;
  let mockDefaultCategoryRuleRepository: IDefaultCategoryRuleRepository;

  const userId = "user-123";

  const defaultCategoriesData: Array<{
    id: string;
    name: string;
    color: string;
    icon: string;
    displayOrder: number;
    isDefault: boolean;
    isOther: boolean;
  }> = [
    {
      id: "default-cat-1",
      name: "食費",
      color: "#FF6B6B",
      icon: "utensils",
      displayOrder: 1,
      isDefault: true,
      isOther: false,
    },
    {
      id: "default-cat-2",
      name: "交通費",
      color: "#4ECDC4",
      icon: "train",
      displayOrder: 2,
      isDefault: true,
      isOther: false,
    },
    {
      id: "default-cat-3",
      name: "その他",
      color: "#9c9c9c",
      icon: "circle-dot",
      displayOrder: 9999,
      isDefault: true,
      isOther: true,
    },
  ];

  const defaultRulesData: Array<{
    id: string;
    keyword: string;
    defaultCategoryId: string;
    priority: number;
  }> = [
    {
      id: "rule-1",
      keyword: "マクドナルド",
      defaultCategoryId: "default-cat-1",
      priority: 0,
    },
    {
      id: "rule-2",
      keyword: "ＪＲ",
      defaultCategoryId: "default-cat-2",
      priority: 0,
    },
  ];

  function createMockRule(id: string, userId: string, keyword: string, categoryId: string, priority: number = 0): Rule {
    return new Rule(id, userId, keyword, categoryId, priority, new Date(), new Date(), null);
  }

  function createMockCategory(
    id: string,
    userId: string,
    name: string,
    color: string,
    icon: string,
    displayOrder: number = 100
  ): Category {
    return new Category({
      id,
      userId,
      name,
      color,
      icon,
      displayOrder,
      isDefault: false,
      isOther: false,
    });
  }

  beforeEach(() => {
    // Mock repositories with proper typing
    const categoryFindByUserIdMock: Mock<(userId: string) => Promise<Category[]>> = mock(async () => []);

    const categoryCreateMock: Mock<(userId: string, input: CreateCategoryInput) => Promise<Category>> = mock(
      async (_userId: string, _input: CreateCategoryInput) => {
        return createMockCategory(
          "new-cat-id",
          _userId,
          _input.name,
          _input.color,
          _input.icon ?? "default-icon",
          _input.displayOrder ?? 100
        );
      }
    );

    mockCategoryRepository = {
      findByUserId: categoryFindByUserIdMock,
      findById: mock(async () => null),
      findByName: mock(async () => null),
      create: categoryCreateMock,
      update: mock(async () => createMockCategory("id", "uid", "n", "c", "i")),
      delete: mock(async () => {}),
    };

    const ruleCreateMock: Mock<(userId: string, input: CreateRuleInput) => Promise<Rule>> = mock(
      async (_userId: string, _input: CreateRuleInput) => {
        return createMockRule("new-rule-id", _userId, _input.keyword, _input.categoryId, _input.priority ?? 0);
      }
    );

    mockRuleRepository = {
      findByUserId: mock(async () => []),
      findById: mock(async () => null),
      findByCategoryId: mock(async () => []),
      create: ruleCreateMock,
      update: mock(async () => createMockRule("id", "uid", "kw", "cat-id", 0)),
      delete: mock(async () => {}),
    };

    mockDefaultCategoryRepository = {
      findAll: mock(async () => defaultCategoriesData),
      findById: mock(async () => null),
    };

    mockDefaultCategoryRuleRepository = {
      findAll: mock(async () => defaultRulesData),
      findById: mock(async () => null),
      findByCategoryId: mock(async () => []),
    };

    service = new CategoryInitializationService(
      mockCategoryRepository,
      mockRuleRepository,
      mockDefaultCategoryRepository,
      mockDefaultCategoryRuleRepository
    );
  });

  describe("initializeForUser", () => {
    it("should initialize categories and rules for new user", async () => {
      // Arrange
      let createdCategoryCount = 0;
      let createdRuleCount = 0;

      const categoryFindByUserIdMock: Mock<(userId: string) => Promise<Category[]>> = mock(async () => []);
      const categoryCreateMock: Mock<(userId: string, input: CreateCategoryInput) => Promise<Category>> = mock(
        async (_userId: string, _input: CreateCategoryInput) => {
          createdCategoryCount++;
          return createMockCategory(
            `user-cat-${createdCategoryCount}`,
            _userId,
            _input.name,
            _input.color,
            _input.icon ?? "default-icon",
            _input.displayOrder ?? 100
          );
        }
      );

      mockCategoryRepository.findByUserId = categoryFindByUserIdMock;
      mockCategoryRepository.create = categoryCreateMock;

      const ruleCreateMock: Mock<(userId: string, input: CreateRuleInput) => Promise<Rule>> = mock(
        async (_userId: string, _input: CreateRuleInput) => {
          createdRuleCount++;
          return createMockRule(
            `user-rule-${createdRuleCount}`,
            _userId,
            _input.keyword,
            _input.categoryId,
            _input.priority ?? 0
          );
        }
      );

      mockRuleRepository.create = ruleCreateMock;

      // Act
      await service.initializeForUser(userId);

      // Assert
      expect(createdCategoryCount).toBe(defaultCategoriesData.length);
      expect(createdRuleCount).toBe(defaultRulesData.length);
      expect(mockCategoryRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(mockDefaultCategoryRepository.findAll).toHaveBeenCalled();
      expect(mockDefaultCategoryRuleRepository.findAll).toHaveBeenCalled();
    });

    it("should not initialize if user already has categories", async () => {
      // Arrange: ユーザーがすべてのデフォルトカテゴリを持っている場合
      const existingCategories: Category[] = defaultCategoriesData.map((dc) =>
        createMockCategory("user-cat-" + dc.id, userId, dc.name, dc.color, dc.icon ?? "default")
      );

      const categoryFindByUserIdMock: Mock<(userId: string) => Promise<Category[]>> = mock(
        async () => existingCategories
      );
      mockCategoryRepository.findByUserId = categoryFindByUserIdMock;

      // Act
      await service.initializeForUser(userId);

      // Assert
      expect(mockCategoryRepository.findByUserId).toHaveBeenCalledWith(userId);
      // 完全にそろっている場合、新規カテゴリ作成は呼ばれず、ルール確認のみ実行される
      expect(mockCategoryRepository.create).not.toHaveBeenCalled();
      // ルール確認のためにデフォルトルールを取得しようとする
      expect(mockDefaultCategoryRuleRepository.findAll).toHaveBeenCalled();
    });

    it("should handle empty default categories gracefully", async () => {
      // Arrange
      const categoryFindByUserIdMock: Mock<(userId: string) => Promise<Category[]>> = mock(async () => []);
      const defaultFindAllMock: Mock<
        () => Promise<
          Array<{
            id: string;
            name: string;
            color: string;
            icon: string;
            displayOrder: number;
            isDefault: boolean;
            isOther: boolean;
          }>
        >
      > = mock(async () => []);

      mockCategoryRepository.findByUserId = categoryFindByUserIdMock;
      mockDefaultCategoryRepository.findAll = defaultFindAllMock;

      // Act
      await service.initializeForUser(userId);

      // Assert
      expect(mockCategoryRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(mockDefaultCategoryRepository.findAll).toHaveBeenCalled();
      expect(mockCategoryRepository.create).not.toHaveBeenCalled();
      expect(mockRuleRepository.create).not.toHaveBeenCalled();
    });

    it("should map default category IDs to new user category IDs correctly", async () => {
      // Arrange
      const categoryIdMap: Record<string, string> = {};
      let categoryCounter = 0;

      const categoryFindByUserIdMock: Mock<(userId: string) => Promise<Category[]>> = mock(async () => []);
      const categoryCreateMock: Mock<(userId: string, input: CreateCategoryInput) => Promise<Category>> = mock(
        async (_userId: string, input: CreateCategoryInput) => {
          const defaultCat = defaultCategoriesData.find((c) => c.name === input.name);
          if (defaultCat) {
            const newId = `user-cat-${++categoryCounter}`;
            categoryIdMap[defaultCat.id] = newId;
          }
          return createMockCategory(
            categoryIdMap[defaultCategoriesData.find((c) => c.name === input.name)?.id || ""],
            _userId,
            input.name,
            input.color,
            input.icon ?? "default-icon",
            input.displayOrder ?? 100
          );
        }
      );

      mockCategoryRepository.findByUserId = categoryFindByUserIdMock;
      mockCategoryRepository.create = categoryCreateMock;

      const ruleCreateMock: Mock<(userId: string, input: CreateRuleInput) => Promise<Rule>> = mock(
        async (_userId: string, input: CreateRuleInput) => {
          return createMockRule("rule-id", _userId, input.keyword, input.categoryId, input.priority ?? 0);
        }
      );

      mockRuleRepository.create = ruleCreateMock;

      // Act
      await service.initializeForUser(userId);

      // Assert
      expect(categoryCounter).toBe(defaultCategoriesData.length);
      // Verify that rules were created with mapped category IDs
      const ruleCalls = (mockRuleRepository.create as Mock<(userId: string, input: CreateRuleInput) => Promise<Rule>>)
        .mock?.calls;
      if (ruleCalls) {
        ruleCalls.forEach((call) => {
          const ruleInput = call[1] as CreateRuleInput;
          expect(ruleInput.categoryId).toMatch(/^user-cat-/);
        });
      }
    });

    it("should skip rules with non-existent default category IDs", async () => {
      // Arrange
      const orphanedRules = [
        ...defaultRulesData,
        {
          id: "rule-orphan",
          keyword: "orphan-keyword",
          defaultCategoryId: "non-existent-category",
          priority: 0,
        },
      ];

      const categoryFindByUserIdMock: Mock<(userId: string) => Promise<Category[]>> = mock(async () => []);
      const categoryCreateMock: Mock<(userId: string, input: CreateCategoryInput) => Promise<Category>> = mock(
        async (_userId: string, input: CreateCategoryInput) => {
          const defaultCat = defaultCategoriesData.find((c) => c.name === input.name);
          return createMockCategory(
            `user-cat-${defaultCat?.id}`,
            _userId,
            input.name,
            input.color,
            input.icon ?? "default-icon",
            input.displayOrder ?? 100
          );
        }
      );

      mockCategoryRepository.findByUserId = categoryFindByUserIdMock;
      mockCategoryRepository.create = categoryCreateMock;

      const defaultRulesFindAllMock: Mock<
        () => Promise<
          Array<{
            id: string;
            keyword: string;
            defaultCategoryId: string;
            priority: number;
          }>
        >
      > = mock(async () => orphanedRules);
      mockDefaultCategoryRuleRepository.findAll = defaultRulesFindAllMock;

      // Act
      await service.initializeForUser(userId);

      // Assert
      // Only valid rules should be created (2, not 3)
      const ruleCalls = (mockRuleRepository.create as Mock<(userId: string, input: CreateRuleInput) => Promise<Rule>>)
        .mock?.calls;
      expect(ruleCalls?.length).toBe(defaultRulesData.length);
    });

    it("should preserve displayOrder and other properties from defaults", async () => {
      // Arrange
      const capturedCreateInputs: CreateCategoryInput[] = [];

      const categoryFindByUserIdMock: Mock<(userId: string) => Promise<Category[]>> = mock(async () => []);
      const categoryCreateMock: Mock<(userId: string, input: CreateCategoryInput) => Promise<Category>> = mock(
        async (_userId: string, input: CreateCategoryInput) => {
          capturedCreateInputs.push(input);
          return createMockCategory(
            "cat-id",
            _userId,
            input.name,
            input.color,
            input.icon ?? "default-icon",
            input.displayOrder ?? 100
          );
        }
      );

      mockCategoryRepository.findByUserId = categoryFindByUserIdMock;
      mockCategoryRepository.create = categoryCreateMock;

      // Act
      await service.initializeForUser(userId);

      // Assert
      expect(capturedCreateInputs.length).toBe(defaultCategoriesData.length);
      capturedCreateInputs.forEach((input, index) => {
        expect(input.name).toBe(defaultCategoriesData[index].name);
        expect(input.color).toBe(defaultCategoriesData[index].color);
        expect(input.icon).toBe(defaultCategoriesData[index].icon);
        expect(input.displayOrder).toBe(defaultCategoriesData[index].displayOrder);
      });
    });

    it("should set correct userId for all inserted categories", async () => {
      // Arrange
      const insertedUserIds: string[] = [];

      const categoryFindByUserIdMock: Mock<(userId: string) => Promise<Category[]>> = mock(async () => []);
      const categoryCreateMock: Mock<(userId: string, input: CreateCategoryInput) => Promise<Category>> = mock(
        async (_userId: string, input: CreateCategoryInput) => {
          insertedUserIds.push(_userId);
          return createMockCategory(
            "cat-id",
            _userId,
            input.name,
            input.color,
            input.icon ?? "default-icon",
            input.displayOrder ?? 100
          );
        }
      );

      mockCategoryRepository.findByUserId = categoryFindByUserIdMock;
      mockCategoryRepository.create = categoryCreateMock;

      // Act
      await service.initializeForUser(userId);

      // Assert
      insertedUserIds.forEach((id) => {
        expect(id).toBe(userId);
      });
    });

    it("should set correct userId for all inserted rules", async () => {
      // Arrange
      const insertedRuleUserIds: string[] = [];

      const categoryFindByUserIdMock: Mock<(userId: string) => Promise<Category[]>> = mock(async () => []);
      const categoryCreateMock: Mock<(userId: string, input: CreateCategoryInput) => Promise<Category>> = mock(
        async (_userId: string, input: CreateCategoryInput) => {
          return createMockCategory(
            `user-cat-${input.name}`,
            _userId,
            input.name,
            input.color,
            input.icon ?? "default-icon",
            input.displayOrder ?? 100
          );
        }
      );

      const ruleCreateMock: Mock<(userId: string, input: CreateRuleInput) => Promise<Rule>> = mock(
        async (_userId: string, _input: CreateRuleInput) => {
          insertedRuleUserIds.push(_userId);
          return createMockRule("rule-id", _userId, _input.keyword, _input.categoryId, _input.priority ?? 0);
        }
      );

      mockCategoryRepository.findByUserId = categoryFindByUserIdMock;
      mockCategoryRepository.create = categoryCreateMock;
      mockRuleRepository.create = ruleCreateMock;

      // Act
      await service.initializeForUser(userId);

      // Assert
      insertedRuleUserIds.forEach((id) => {
        expect(id).toBe(userId);
      });
    });

    it("should handle special characters in category names and keywords", async () => {
      // Arrange
      const specialCharCategories = [
        {
          id: "special-1",
          name: "日用品（生活用品）",
          color: "#FF0000",
          icon: "shopping",
          displayOrder: 1,
          isDefault: true,
          isOther: false,
        },
      ];

      const specialCharRules = [
        {
          id: "rule-special",
          keyword: "セブン－イレブン",
          defaultCategoryId: "special-1",
          priority: 0,
        },
      ];

      const categoryFindByUserIdMock: Mock<(userId: string) => Promise<Category[]>> = mock(async () => []);
      const categoryCreateMock: Mock<(userId: string, input: CreateCategoryInput) => Promise<Category>> = mock(
        async (_userId: string, input: CreateCategoryInput) => {
          return createMockCategory(
            "user-cat-special",
            _userId,
            input.name,
            input.color,
            input.icon ?? "default-icon",
            input.displayOrder ?? 100
          );
        }
      );

      const defaultCategoryFindAllMock: Mock<
        () => Promise<
          Array<{
            id: string;
            name: string;
            color: string;
            icon: string;
            displayOrder: number;
            isDefault: boolean;
            isOther: boolean;
          }>
        >
      > = mock(async () => specialCharCategories);

      const defaultRuleFindAllMock: Mock<
        () => Promise<
          Array<{
            id: string;
            keyword: string;
            defaultCategoryId: string;
            priority: number;
          }>
        >
      > = mock(async () => specialCharRules);

      mockCategoryRepository.findByUserId = categoryFindByUserIdMock;
      mockCategoryRepository.create = categoryCreateMock;
      mockDefaultCategoryRepository.findAll = defaultCategoryFindAllMock;
      mockDefaultCategoryRuleRepository.findAll = defaultRuleFindAllMock;

      // Act
      await service.initializeForUser(userId);

      // Assert
      expect(mockCategoryRepository.create).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ name: "日用品（生活用品）" })
      );
      expect(mockRuleRepository.create).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ keyword: "セブン－イレブン" })
      );
    });

    it("should create categories before rules to ensure proper relationships", async () => {
      // Arrange
      const callOrder: string[] = [];

      const categoryFindByUserIdMock: Mock<(userId: string) => Promise<Category[]>> = mock(async () => []);
      const categoryCreateMock: Mock<(userId: string, input: CreateCategoryInput) => Promise<Category>> = mock(
        async (_userId: string, input: CreateCategoryInput) => {
          callOrder.push("category");
          return createMockCategory(
            `user-cat-${input.name}`,
            _userId,
            input.name,
            input.color,
            input.icon ?? "default-icon",
            input.displayOrder ?? 100
          );
        }
      );

      const ruleCreateMock: Mock<(userId: string, input: CreateRuleInput) => Promise<Rule>> = mock(
        async (_userId: string, _input: CreateRuleInput) => {
          callOrder.push("rule");
          return createMockRule("rule-id", _userId, _input.keyword, _input.categoryId, _input.priority ?? 0);
        }
      );

      mockCategoryRepository.findByUserId = categoryFindByUserIdMock;
      mockCategoryRepository.create = categoryCreateMock;
      mockRuleRepository.create = ruleCreateMock;

      // Act
      await service.initializeForUser(userId);

      // Assert
      // All categories should be created before any rules
      const firstRuleIndex = callOrder.indexOf("rule");
      const categoryCount = callOrder.filter((c) => c === "category").length;
      expect(firstRuleIndex).toBeGreaterThanOrEqual(categoryCount);
    });

    it("should handle repository errors gracefully", async () => {
      // Arrange
      const errorMock: Mock<(userId: string) => Promise<Category[]>> = mock(async () => {
        throw new Error("Database error");
      });

      mockCategoryRepository.findByUserId = errorMock;

      // Act & Assert
      await expect(service.initializeForUser(userId)).rejects.toThrow("Database error");
    });
  });
});
