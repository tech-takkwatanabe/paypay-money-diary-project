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

    // システムカテゴリは全ユーザーがアクセス可能（読み取り専用）
    if (category.isSystemCategory()) {
      return category;
    }

    // ユーザー固有カテゴリの場合、所有者チェック
    if (!category.belongsToUser(userId)) {
      throw new Error("Unauthorized access to category");
    }

    return category;
  }

  /**
   * カテゴリが更新可能か確認（システムカテゴリは更新不可）
   * @throws Error 更新不可能な場合
   */
  async ensureUserCanUpdate(categoryId: string, userId: string): Promise<Category> {
    const category = await this.ensureUserCanAccess(categoryId, userId);

    if (category.isSystemCategory()) {
      throw new Error("Cannot modify system category");
    }

    return category;
  }

  /**
   * カテゴリが削除可能か確認（システムカテゴリおよびデフォルトカテゴリは削除不可）
   * @throws Error 削除不可能な場合
   */
  async ensureUserCanDelete(categoryId: string, userId: string): Promise<Category> {
    const category = await this.ensureUserCanAccess(categoryId, userId);

    if (category.isSystemCategory()) {
      throw new Error("Cannot delete system category");
    }

    if (!category.canDelete()) {
      throw new Error("Cannot delete default category");
    }

    return category;
  }
}
