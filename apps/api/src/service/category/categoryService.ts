import { ICategoryRepository } from "@/domain/repository/categoryRepository";
import { Category } from "@/domain/entity/category";

/**
 * Category Service
 * カテゴリに関連する共通ロジックを提供
 */
export class CategoryService {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  /**
   * カテゴリが存在し、ユーザーがアクセス権を持っているか確認
   * @throws Error カテゴリが見つからない、または権限がない場合
   */
  async ensureUserCanAccess(categoryId: string, userId: string): Promise<Category> {
    const category = await this.categoryRepository.findById(categoryId);

    if (!category) {
      throw new Error("Category not found");
    }

    // ユーザー固有カテゴリの場合、所有者チェック
    if (!category.belongsToUser(userId)) {
      throw new Error("Unauthorized access to category");
    }

    return category;
  }

  /**
   * カテゴリが更新可能か確認
   * @throws Error 更新不可能な場合
   */
  async ensureUserCanUpdate(categoryId: string, userId: string): Promise<Category> {
    const category = await this.ensureUserCanAccess(categoryId, userId);

    // 「その他」カテゴリは名前の変更などを制限する場合があるが、
    // 要件では「表示順も必ず最後に表示されるようにする」とあるため、
    // ここでは基本的なアクセスチェックのみ行う。
    // 並び替えロジック側で「その他」を末尾に固定する。

    return category;
  }

  /**
   * カテゴリが削除可能か確認（「その他」カテゴリは削除不可）
   * @throws Error 削除不可能な場合
   */
  async ensureUserCanDelete(categoryId: string, userId: string): Promise<Category> {
    const category = await this.ensureUserCanAccess(categoryId, userId);

    // 「その他」カテゴリは削除不可
    if (category.name === "その他") {
      throw new Error("Cannot delete 'その他' category");
    }

    return category;
  }

  /**
   * カテゴリの並び替えリクエストを検証
   * @param userId ユーザーID
   * @param categoryIds 並び替え後のカテゴリIDリスト
   * @throws Error バリデーション失敗時
   */
  async validateReorder(userId: string, categoryIds: string[]): Promise<void> {
    // 1. ユーザーの全カテゴリを取得して検証
    const userCategories = await this.categoryRepository.findByUserId(userId);
    const userCategoryIds = new Set(userCategories.map((c) => c.id));
    const otherCategory = userCategories.find((c) => c.isOther);

    // 送信されたIDがすべてユーザーのものであることを確認
    for (const id of categoryIds) {
      if (!userCategoryIds.has(id)) {
        throw new Error(`Unauthorized or invalid category ID: ${id}`);
      }
    }

    // 重複チェック
    const uniqueIds = new Set(categoryIds);
    if (uniqueIds.size !== categoryIds.length) {
      throw new Error("Duplicate category IDs in reorder request");
    }

    // 「その他」がリストに含まれていないかチェック
    if (otherCategory && uniqueIds.has(otherCategory.id)) {
      throw new Error("Cannot reorder 'Others' category - it must always be at the end");
    }

    // 「その他」以外のカテゴリがすべて含まれているか確認
    const reorderableIdSet = new Set(userCategories.filter((c) => !c.isOther).map((c) => c.id));
    if (![...reorderableIdSet].every((id) => uniqueIds.has(id))) {
      throw new Error("Reorder list must include all categories except 'Others'");
    }
  }

  /**
   * カテゴリ名が一意であることを確認
   * @param userId ユーザーID
   * @param name カテゴリ名
   * @param excludeId 重複チェックから除外するカテゴリID（更新時用）
   * @throws Error すでに同名のカテゴリが存在する場合
   */
  async ensureNameIsUnique(userId: string, name: string, excludeId?: string): Promise<void> {
    const existing = await this.categoryRepository.findByName(userId, name);
    if (existing && existing.id !== excludeId) {
      throw new Error("Category with this name already exists");
    }
  }
}
