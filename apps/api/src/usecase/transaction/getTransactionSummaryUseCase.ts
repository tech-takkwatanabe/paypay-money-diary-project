import { ITransactionRepository } from "@/domain/repository/transactionRepository";
import { TransactionService } from "@/service/transaction/transactionService";

export interface GetTransactionSummaryInput {
  userId: string;
  year: number;
  month?: number;
}

export class GetTransactionSummaryUseCase {
  constructor(
    private transactionRepository: ITransactionRepository,
    private transactionService: TransactionService
  ) {}

  async execute(input: GetTransactionSummaryInput) {
    const { userId, year, month } = input;

    const transactions = await this.transactionRepository.findByUserId(userId, { year, month });

    const summary = this.transactionService.calculateSummary(transactions);

    let monthlyBreakdown: ReturnType<TransactionService["calculateMonthlyBreakdown"]> = [];
    if (year && !month) {
      monthlyBreakdown = this.transactionService.calculateMonthlyBreakdown(transactions);
    }

    return {
      summary: {
        totalAmount: summary.totalAmount,
        transactionCount: summary.transactionCount,
      },
      categoryBreakdown: summary.categoryBreakdown,
      monthlyBreakdown,
    };
  }
}
