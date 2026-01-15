import { ITransactionRepository } from "@/domain/repository/transactionRepository";
import { Transaction } from "@/domain/entity/transaction";

export class TransactionService {
  constructor(private transactionRepository: ITransactionRepository) {}

  /**
   * ユーザーがトランザクションにアクセスできるか確認
   */
  async ensureUserCanAccess(transactionId: string, userId: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findById(transactionId);
    if (!transaction) {
      throw new Error("Transaction not found");
    }
    if (!transaction.belongsToUser(userId)) {
      throw new Error("Forbidden: You do not have access to this transaction");
    }
    return transaction;
  }

  /**
   * トランザクションデータを集計
   */
  calculateSummary(transactions: Transaction[]) {
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const transactionCount = transactions.length;

    // カテゴリ別集計
    const categoryMap = new Map<
      string,
      {
        categoryId: string | null;
        categoryName: string;
        categoryColor: string;
        displayOrder: number;
        totalAmount: number;
        transactionCount: number;
      }
    >();

    transactions.forEach((t) => {
      const key = t.categoryId || "unclassified";
      if (!categoryMap.has(key)) {
        categoryMap.set(key, {
          categoryId: t.categoryId,
          categoryName: t.categoryName || "未分類",
          categoryColor: t.categoryColor || "#CCCCCC",
          displayOrder: t.displayOrder ?? 100,
          totalAmount: 0,
          transactionCount: 0,
        });
      }
      const data = categoryMap.get(key)!;
      data.totalAmount += t.amount;
      data.transactionCount += 1;
    });

    return {
      totalAmount,
      transactionCount,
      categoryBreakdown: Array.from(categoryMap.values()).sort((a, b) => a.displayOrder - b.displayOrder),
    };
  }

  /**
   * 月別集計（年単位のデータ用）
   */
  calculateMonthlyBreakdown(transactions: Transaction[]) {
    const monthlyMap = new Map<
      number,
      {
        month: number;
        totalAmount: number;
        categories: Map<
          string,
          {
            categoryId: string | null;
            categoryName: string;
            categoryColor: string;
            displayOrder: number;
            amount: number;
          }
        >;
      }
    >();

    transactions.forEach((t) => {
      const month = t.date.getMonth() + 1;
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, {
          month,
          totalAmount: 0,
          categories: new Map(),
        });
      }
      const monthData = monthlyMap.get(month)!;
      monthData.totalAmount += t.amount;

      const catKey = t.categoryId || "unclassified";
      if (!monthData.categories.has(catKey)) {
        monthData.categories.set(catKey, {
          categoryId: t.categoryId,
          categoryName: t.categoryName || "未分類",
          categoryColor: t.categoryColor || "#CCCCCC",
          displayOrder: t.displayOrder ?? 100,
          amount: 0,
        });
      }
      monthData.categories.get(catKey)!.amount += t.amount;
    });

    return Array.from(monthlyMap.values())
      .map((m) => ({
        ...m,
        categories: Array.from(m.categories.values()).sort((a, b) => a.displayOrder - b.displayOrder),
      }))
      .sort((a, b) => a.month - b.month);
  }
}
