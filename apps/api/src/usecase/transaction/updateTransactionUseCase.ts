import { ITransactionRepository } from "@/domain/repository/transactionRepository";
import { TransactionService } from "@/service/transaction/transactionService";
import { UpdateTransactionInput } from "@paypay-money-diary/shared";

export class UpdateTransactionUseCase {
  constructor(
    private transactionRepository: ITransactionRepository,
    private transactionService: TransactionService
  ) {}

  async execute(id: string, userId: string, input: UpdateTransactionInput) {
    // 権限チェック
    await this.transactionService.ensureUserCanAccess(id, userId);

    const updatedTransaction = await this.transactionRepository.update(id, input);
    return updatedTransaction.toResponse();
  }
}
