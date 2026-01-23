import { ITransactionRepository } from "@/domain/repository/transactionRepository";
import { TransactionListQuery } from "@paypay-money-diary/shared";

export class ListTransactionsUseCase {
  constructor(private transactionRepository: ITransactionRepository) {}

  async execute(userId: string, query: TransactionListQuery) {
    const page = Math.max(1, parseInt(query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || "50", 10)));

    const options = {
      year: query.year ? parseInt(query.year, 10) : undefined,
      month: query.month ? parseInt(query.month, 10) : undefined,
      categoryId: query.categoryId,
      search: query.search,
      pagination: { page, limit },
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    };

    const transactions = await this.transactionRepository.findByUserId(userId, options);
    const totalCount = await this.transactionRepository.countByUserId(userId, options);
    const totalAmount = await this.transactionRepository.sumByUserId(userId, options);

    return {
      data: transactions.map((t) => t.toResponse()),
      pagination: {
        page,
        limit,
        totalCount,
        totalAmount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }
}
