import { Transaction } from "@/domain/entity/transaction";
import { UpdateTransactionInput } from "@paypay-money-diary/shared";

/**
 * Transaction Repository Interface
 * トランザクションのデータアクセスを抽象化
 */
export interface ITransactionRepository {
  /**
   * ユーザーIDでトランザクションを検索
   */
  findByUserId(
    userId: string,
    options?: {
      year?: number;
      month?: number;
      categoryId?: string;
      search?: string;
      pagination?: {
        page: number;
        limit: number;
      };
    }
  ): Promise<Transaction[]>;

  /**
   * 条件に一致するトランザクションの総件数を取得
   */
  countByUserId(
    userId: string,
    options?: {
      year?: number;
      month?: number;
      categoryId?: string;
      search?: string;
    }
  ): Promise<number>;

  /**
   * 条件に一致するトランザクションの総額を取得
   */
  sumByUserId(
    userId: string,
    options?: {
      year?: number;
      month?: number;
      categoryId?: string;
      search?: string;
    }
  ): Promise<number>;

  /**
   * IDでトランザクションを検索
   */
  findById(id: string): Promise<Transaction | null>;

  /**
   * トランザクションを作成
   */
  create(transaction: {
    userId: string;
    date: Date;
    description: string;
    amount: number;
    categoryId: string;
    categoryName: string;
    categoryColor: string;
    displayOrder: number;
    paymentMethod?: string | null;
    externalTransactionId?: string;
  }): Promise<Transaction>;

  /**
   * トランザクションを更新
   */
  update(id: string, input: UpdateTransactionInput): Promise<Transaction>;

  /**
   * トランザクションを削除
   */
  delete(id: string): Promise<void>;

  /**
   * ユーザーの利用可能な年度を取得
   */
  getAvailableYears(userId: string): Promise<number[]>;

  /**
   * 指定された年月のトランザクションのカテゴリを再分類
   */
  reCategorizeByRules(userId: string, year?: number, month?: number): Promise<number>;

  /**
   * 複数のトランザクションを一括作成
   */
  createMany(
    transactions: Array<{
      userId: string;
      date: Date;
      description: string;
      amount: number;
      categoryId: string;
      categoryName: string;
      categoryColor: string;
      displayOrder: number;
      paymentMethod?: string | null;
      externalTransactionId?: string;
    }>
  ): Promise<Transaction[]>;

  /**
   * 外部取引IDでトランザクションが存在するか確認
   */
  existsByExternalId(userId: string, externalId: string): Promise<boolean>;

  /**
   * カテゴリを一括変更
   */
  reCategorize(userId: string, fromCategoryId: string, toCategoryId: string): Promise<number>;
}
