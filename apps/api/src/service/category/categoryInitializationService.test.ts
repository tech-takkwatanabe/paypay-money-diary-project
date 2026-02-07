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

  const createMockRule = (
    id: string,
    userId: string,
    keyword: string,
    categoryId: string,
    priority: number = 0
  ): Rule => {
    return new Rule(id, userId, keyword, categoryId, priority, new Date(), new Date(), null);
  };

  const createMockCategory = (
    id: string,
    userId: string,
    name: string,
    color: string,
    icon: string,
    displayOrder: number = 100,
    isDefault: boolean = false,
    isOther: boolean = false
  ): Category => {
    return new Category({
      id,
      userId,
      name,
      color,
      icon,
      displayOrder,
      isDefault,
      isOther,
    });
  };

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
      createInternal: categoryCreateMock,
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
      findByUserIdAndKeyword: mock(async () => null),
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
      // Arrange: 既存カテゴリがない
      const categoryFindByUserIdMock: Mock<(userId: string) => Promise<Category[]>> = mock(async () => []);
      mockCategoryRepository.findByUserId = categoryFindByUserIdMock;

      // Act
      await service.initializeForUser(userId);

      // Assert
      expect(mockCategoryRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(mockDefaultCategoryRepository.findAll).toHaveBeenCalled();
      expect(mockDefaultCategoryRuleRepository.findAll).toHaveBeenCalled();
      expect(mockCategoryRepository.createInternal).toHaveBeenCalledTimes(defaultCategoriesData.length);
      expect(mockRuleRepository.create).toHaveBeenCalledTimes(defaultRulesData.length);
    });

    it("should not initialize if user already has all default categories", async () => {
      // Arrange: デフォルトカテゴリが既に存在（isDefault=true）
      const existingCategories: Category[] = defaultCategoriesData.map((dc, idx) =>
        createMockCategory(
          `existing-cat-${idx}`,
          userId,
          dc.name,
          dc.color,
          dc.icon ?? "default",
          dc.displayOrder,
          true, // isDefault=true
          dc.isOther
        )
      );

      const categoryFindByUserIdMock: Mock<(userId: string) => Promise<Category[]>> = mock(
        async () => existingCategories
      );
      mockCategoryRepository.findByUserId = categoryFindByUserIdMock;

      // Act
      await service.initializeForUser(userId);

      // Assert
      expect(mockCategoryRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(mockCategoryRepository.createInternal).not.toHaveBeenCalled();
      // ルール確認のためにデフォルトルールを取得
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
      expect(mockCategoryRepository.createInternal).not.toHaveBeenCalled();
      expect(mockRuleRepository.create).not.toHaveBeenCalled();
    });

    it("should create rules only for mapped categories", async () => {
      // Arrange: 既存デフォルトカテゴリあり（両方のカテゴリをセットアップ）
      const existingCategories: Category[] = [
        createMockCategory(
          `cat-${defaultCategoriesData[0].id}`,
          userId,
          defaultCategoriesData[0].name,
          defaultCategoriesData[0].color,
          defaultCategoriesData[0].icon ?? "default",
          defaultCategoriesData[0].displayOrder,
          true,
          false
        ),
        createMockCategory(
          `cat-${defaultCategoriesData[1].id}`,
          userId,
          defaultCategoriesData[1].name,
          defaultCategoriesData[1].color,
          defaultCategoriesData[1].icon ?? "default",
          defaultCategoriesData[1].displayOrder,
          true,
          false
        ),
      ];

      const categoryFindByUserIdMock: Mock<(userId: string) => Promise<Category[]>> = mock(
        async () => existingCategories
      );
      mockCategoryRepository.findByUserId = categoryFindByUserIdMock;

      // Act
      await service.initializeForUser(userId);

      // Assert
      expect(mockRuleRepository.create).toHaveBeenCalledTimes(defaultRulesData.length);
      // すべてのルール呼び出しで、対応する正しいカテゴリIDが使用されることを確認
      const createMock = mockRuleRepository.create as Mock<(userId: string, input: CreateRuleInput) => Promise<Rule>>;
      const calls = createMock.mock?.calls || [];
      calls.forEach((call: (string | CreateRuleInput)[]) => {
        const input = call[1] as CreateRuleInput;
        // 各ルールが対応するカテゴリにマッピングされていることを確認
        const defaultRule = defaultRulesData.find((r) => r.keyword === input.keyword);
        const expectedCategoryId = `cat-${defaultRule?.defaultCategoryId}`;
        expect(input.categoryId).toBe(expectedCategoryId);
      });
    });

    it("should skip rules with unmapped default categories", async () => {
      // Arrange
      const orphanedRules = [
        {
          id: "rule-orphan",
          keyword: "unmapped-keyword",
          defaultCategoryId: "non-existent-default-cat",
          priority: 0,
        },
      ];

      const categoryFindByUserIdMock: Mock<(userId: string) => Promise<Category[]>> = mock(async () => []);
      const defaultRuleFindAllMock: Mock<
        () => Promise<
          Array<{
            id: string;
            keyword: string;
            defaultCategoryId: string;
            priority: number;
          }>
        >
      > = mock(async () => orphanedRules);

      mockCategoryRepository.findByUserId = categoryFindByUserIdMock;
      mockDefaultCategoryRuleRepository.findAll = defaultRuleFindAllMock;

      // Act
      await service.initializeForUser(userId);

      // Assert
      // ルール作成は呼ばれない（unmappedだから）
      expect(mockRuleRepository.create).not.toHaveBeenCalled();
    });

    it("should avoid duplicate rules for existing keywords", async () => {
      // Arrange: 両方の既存ルールを設定
      const existingCategories: Category[] = [
        createMockCategory(
          "cat-1",
          userId,
          defaultCategoriesData[0].name,
          defaultCategoriesData[0].color,
          defaultCategoriesData[0].icon ?? "default",
          defaultCategoriesData[0].displayOrder,
          true,
          false
        ),
        createMockCategory(
          "cat-2",
          userId,
          defaultCategoriesData[1].name,
          defaultCategoriesData[1].color,
          defaultCategoriesData[1].icon ?? "default",
          defaultCategoriesData[1].displayOrder,
          true,
          false
        ),
      ];

      const existingRules = [
        createMockRule("existing-rule-1", userId, defaultRulesData[0].keyword, "cat-1", defaultRulesData[0].priority),
        createMockRule("existing-rule-2", userId, defaultRulesData[1].keyword, "cat-2", defaultRulesData[1].priority),
      ];

      const categoryFindByUserIdMock: Mock<(userId: string) => Promise<Category[]>> = mock(
        async () => existingCategories
      );
      const ruleCheckMock: Mock<(userId: string, keyword: string) => Promise<Rule | null>> = mock(
        async (uid, keyword) => {
          // すべてのデフォルトルールが既存ルールとして返す
          const existingRule = existingRules.find((r) => r.keyword === keyword && r.userId === uid);
          return existingRule || null;
        }
      );

      mockCategoryRepository.findByUserId = categoryFindByUserIdMock;
      mockRuleRepository.findByUserIdAndKeyword = ruleCheckMock;

      // Act
      await service.initializeForUser(userId);

      // Assert
      // すべての既存ルールはスキップされる
      expect(mockRuleRepository.create).not.toHaveBeenCalled();
    });

    it("should preserve category properties from defaults", async () => {
      // Arrange
      const capturedInputs: CreateCategoryInput[] = [];

      const categoryFindByUserIdMock: Mock<(userId: string) => Promise<Category[]>> = mock(async () => []);
      const categoryCreateMock: Mock<(userId: string, input: CreateCategoryInput) => Promise<Category>> = mock(
        async (_userId: string, input: CreateCategoryInput) => {
          capturedInputs.push(input);
          const defaultCat = defaultCategoriesData.find((c) => c.name === input.name);
          return createMockCategory(
            `user-cat-${defaultCat?.id || "unknown"}`,
            _userId,
            input.name,
            input.color,
            input.icon ?? "default",
            input.displayOrder,
            true
          );
        }
      );

      mockCategoryRepository.findByUserId = categoryFindByUserIdMock;
      mockCategoryRepository.createInternal = categoryCreateMock;

      // Act
      await service.initializeForUser(userId);

      // Assert
      expect(mockCategoryRepository.createInternal).toHaveBeenCalledTimes(defaultCategoriesData.length);
      capturedInputs.forEach((input, idx) => {
        const defaultCat = defaultCategoriesData[idx];
        expect(input.name).toBe(defaultCat.name);
        expect(input.color).toBe(defaultCat.color);
        expect(input.icon).toBe(defaultCat.icon);
        expect(input.displayOrder).toBe(defaultCat.displayOrder);
      });
    });

    it("should handle repository errors gracefully", async () => {
      // Arrange
      const errorMock: Mock<(userId: string) => Promise<Category[]>> = mock(async () => {
        throw new Error("Database error");
      });

      mockCategoryRepository.findByUserId = errorMock;

      // Act & Assert
      expect(service.initializeForUser(userId)).rejects.toThrow("Database error");
    });
  });
});
