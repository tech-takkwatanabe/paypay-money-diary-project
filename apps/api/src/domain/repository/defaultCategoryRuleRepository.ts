/**
 * Default Category Rule Repository Interface
 * デフォルトカテゴリルールのデータアクセスを抽象化
 */
export type IDefaultCategoryRuleRepository = {
  /**
   * すべてのデフォルトカテゴリルールを取得
   */
  findAll(): Promise<Array<{ id: string; keyword: string; defaultCategoryId: string; priority: number }>>;

  /**
   * デフォルトカテゴリルールをIDで検索
   */
  findById(id: string): Promise<{ id: string; keyword: string; defaultCategoryId: string; priority: number } | null>;

  /**
   * カテゴリIDに関連するデフォルトルールを取得
   */
  findByCategoryId(
    categoryId: string
  ): Promise<Array<{ id: string; keyword: string; defaultCategoryId: string; priority: number }>>;
};
