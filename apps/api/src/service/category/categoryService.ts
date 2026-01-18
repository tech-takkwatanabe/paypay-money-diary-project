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
}
