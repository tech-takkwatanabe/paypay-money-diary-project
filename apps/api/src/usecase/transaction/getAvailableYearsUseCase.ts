import { ITransactionRepository } from "@/domain/repository/transactionRepository";

export class GetAvailableYearsUseCase {
  constructor(private transactionRepository: ITransactionRepository) {}

  async execute(userId: string) {
    const years = await this.transactionRepository.getAvailableYears(userId);
    return { years };
  }
}
