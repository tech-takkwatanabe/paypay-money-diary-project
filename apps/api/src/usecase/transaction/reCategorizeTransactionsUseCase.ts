import { ITransactionRepository } from "@/domain/repository/transactionRepository";

export interface ReCategorizeTransactionsInput {
  userId: string;
  year: number;
  month?: number;
}

export class ReCategorizeTransactionsUseCase {
  constructor(private transactionRepository: ITransactionRepository) {}

  async execute(input: ReCategorizeTransactionsInput) {
    const { userId, year, month } = input;

    const updatedCount = await this.transactionRepository.reCategorizeByRules(userId, year, month);

    return {
      message: `${updatedCount}件の取引を再分類しました。`,
      updatedCount,
    };
  }
}
