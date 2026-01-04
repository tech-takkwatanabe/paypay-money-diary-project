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
    }
  ): Promise<Transaction[]>;

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
  reCategorizeByRules(userId: string, year: number, month?: number): Promise<number>;

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
    }>
  ): Promise<Transaction[]>;
}
