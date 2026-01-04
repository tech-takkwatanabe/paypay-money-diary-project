import { Category } from "@/domain/entity/category";
import { CreateCategoryInput, UpdateCategoryInput } from "@paypay-money-diary/shared";

/**
 * Category Repository Interface
 * カテゴリのデータアクセスを抽象化
 */
export interface ICategoryRepository {
  /**
   * ユーザーIDでカテゴリを検索（システムカテゴリを含む）
   */
  findByUserId(userId: string): Promise<Category[]>;

  /**
   * IDでカテゴリを検索
   */
  findById(id: string): Promise<Category | null>;

  /**
   * カテゴリを作成
   */
  create(userId: string, input: CreateCategoryInput): Promise<Category>;

  /**
   * カテゴリを更新
   */
  update(id: string, input: UpdateCategoryInput): Promise<Category>;

  /**
   * カテゴリを削除
   */
  delete(id: string): Promise<void>;
}
