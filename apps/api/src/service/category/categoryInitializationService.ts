import { ICategoryRepository } from "@/domain/repository/categoryRepository";
import { IRuleRepository } from "@/domain/repository/ruleRepository";
import { IDefaultCategoryRepository } from "@/domain/repository/defaultCategoryRepository";
import { IDefaultCategoryRuleRepository } from "@/domain/repository/defaultCategoryRuleRepository";
import { Category } from "@/domain/entity/category";
import { CreateCategoryInput, CreateRuleInput } from "@paypay-money-diary/shared";

/**
 * Category Initialization Service
 * 新規ユーザー向けにデフォルトカテゴリとルールをコピーして初期化する
 */
export class CategoryInitializationService {
  constructor(
    private readonly categoryRepository: ICategoryRepository,
    private readonly ruleRepository: IRuleRepository,
    private readonly defaultCategoryRepository: IDefaultCategoryRepository,
    private readonly defaultCategoryRuleRepository: IDefaultCategoryRuleRepository
  ) {}

  /**
   * ユーザーのカテゴリとルールを初期化（べき等）
   * @param userId ユーザーのUUID
   * @throws Error カテゴリの取得または作成に失敗した場合
   *
   * 注: 部分初期化からの安全な再開を保証するため、べき等実装を採用
   * isDefaultフラグを信頼し、デフォルトカテゴリのみを特別に扱う
   */
  async initializeForUser(userId: string): Promise<void> {
    // 1. ユーザーの既存カテゴリを取得
    const existingCategories = await this.categoryRepository.findByUserId(userId);

    // 2. デフォルトカテゴリを取得
    const defaultCategories = await this.defaultCategoryRepository.findAll();

    // 3. isDefaultフラグでマーク済みの既存カテゴリをフィルタリング
    const existingDefaultCategories = existingCategories.filter((cat) => cat.isDefault === true);

    // 4. カテゴリIDのマッピングを構築（isDefault=trueのみを対象）
    const categoryIdMap = new Map<string, string>();

    for (const defaultCategory of defaultCategories) {
      // nameとisOtherの複合キーで既存のデフォルトカテゴリを特定
      const existingCategory = this.findMatchingExistingCategory(existingDefaultCategories, defaultCategory);

      if (existingCategory) {
        // 既に存在する場合はIDをマッピング
        categoryIdMap.set(defaultCategory.id, existingCategory.id);
      } else {
        // 存在しない場合は作成
        const createInput: CreateCategoryInput = {
          name: defaultCategory.name,
          color: defaultCategory.color,
          icon: defaultCategory.icon,
          displayOrder: defaultCategory.displayOrder,
          isDefault: true,
          isOther: defaultCategory.isOther,
        };

        const createdCategory = await this.categoryRepository.create(userId, createInput);
        categoryIdMap.set(defaultCategory.id, createdCategory.id);
      }
    }

    // 5. ルールを確認・作成
    await this.ensureRulesExist(userId, categoryIdMap);
  }

  /**
   * 既存カテゴリとデフォルトカテゴリをマッチング
   * nameとisOtherの複合キーで確実に一対一のマッピングを実現
   * @param existingDefaultCategories 既存のデフォルトカテゴリ（isDefault=true）
   * @param defaultCategory マッチング対象のデフォルトカテゴリ
   * @returns マッチングした既存カテゴリ、存在しない場合はundefined
   */
  private findMatchingExistingCategory(
    existingDefaultCategories: Category[],
    defaultCategory: { name: string; isOther: boolean }
  ): Category | undefined {
    return existingDefaultCategories.find(
      (cat) => cat.name === defaultCategory.name && cat.isOther === defaultCategory.isOther
    );
  }

  /**
   * ルールが揃っているか確認し、不足しているものを作成
   * @param userId ユーザーのUUID
   * @param categoryIdMap デフォルトカテゴリIDから新しいIDへのマッピング
   */
  private async ensureRulesExist(userId: string, categoryIdMap: Map<string, string>): Promise<void> {
    // デフォルトルールを取得
    const defaultRules = await this.defaultCategoryRuleRepository.findAll();

    // ルールを作成（既存するかどうかはリポジトリ層で事前チェック）
    for (const defaultRule of defaultRules) {
      const newCategoryId = categoryIdMap.get(defaultRule.defaultCategoryId);
      if (!newCategoryId) {
        console.warn("[CategoryInitializationService]", {
          action: "skipping_rule",
          userId,
          keyword: defaultRule.keyword,
          defaultCategoryId: defaultRule.defaultCategoryId,
          reason: "default_category_not_found_in_mapping",
        });
        continue;
      }

      // 既存ルールをチェック
      const existingRule = await this.ruleRepository.findByUserIdAndKeyword(userId, defaultRule.keyword);
      if (existingRule) {
        // 既にあれば作成をスキップ
        continue;
      }

      // 新規ルールを作成
      const createRuleInput: CreateRuleInput = {
        keyword: defaultRule.keyword,
        categoryId: newCategoryId,
        priority: defaultRule.priority,
      };

      await this.ruleRepository.create(userId, createRuleInput);
    }
  }
}

