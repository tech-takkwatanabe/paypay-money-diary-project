/**
 * Default Category Repository Interface
 * デフォルトカテゴリのデータアクセスを抽象化
 */
export interface IDefaultCategoryRepository {
  /**
   * すべてのデフォルトカテゴリを取得
   */
  findAll(): Promise<
    Array<{
      id: string;
      name: string;
      color: string;
      icon: string | null;
      displayOrder: number;
      isDefault: boolean;
      isOther: boolean;
    }>
  >;

  /**
   * デフォルトカテゴリをIDで検索
   */
  findById(id: string): Promise<{
    id: string;
    name: string;
    color: string;
    icon: string | null;
    displayOrder: number;
    isDefault: boolean;
    isOther: boolean;
  } | null>;
}
