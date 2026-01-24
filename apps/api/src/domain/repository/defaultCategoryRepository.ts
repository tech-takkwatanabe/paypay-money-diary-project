/**
 * Default Category Repository Interface
 * デフォルトカテゴリのデータアクセスを抽象化
 */

export type DefaultCategoryData = {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  displayOrder: number;
  isDefault: boolean;
  isOther: boolean;
};

export interface IDefaultCategoryRepository {
  /**
   * すべてのデフォルトカテゴリを取得
   */
  findAll(): Promise<DefaultCategoryData[]>;

  /**
   * デフォルトカテゴリをIDで検索
   */
  findById(id: string): Promise<DefaultCategoryData | null>;
}
