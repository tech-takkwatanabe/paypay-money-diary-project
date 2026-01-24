import { Category } from "@/domain/entity/category";
import { CreateCategoryInput, InternalCreateCategoryInput, UpdateCategoryInput } from "@paypay-money-diary/shared";

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
   * ユーザーIDと名前でカテゴリを検索
   */
  findByName(userId: string, name: string): Promise<Category | null>;

  /**
   * カテゴリを作成
   * @param userId ユーザーID
   * @param input カテゴリ入力（公開API用）
   */
  create(userId: string, input: CreateCategoryInput): Promise<Category>;

  /**
   * 内部用: デフォルトカテゴリを作成
   * @param userId ユーザーID
   * @param input カテゴリ入力（サーバー内部用 - isDefault/isOther を含む）
   */
  createInternal(userId: string, input: InternalCreateCategoryInput): Promise<Category>;

  /**
   * カテゴリを更新
   */
  update(id: string, input: UpdateCategoryInput): Promise<Category>;

  /**
   * カテゴリを削除
   */
  delete(id: string): Promise<void>;
}
