import { ITransactionRepository } from "@/domain/repository/transactionRepository";
import { TransactionService } from "@/service/transaction/transactionService";

export class DeleteTransactionUseCase {
  constructor(
    private transactionRepository: ITransactionRepository,
    private transactionService: TransactionService
  ) {}

  async execute(id: string, userId: string) {
    // 権限チェック
    const transaction = await this.transactionService.ensureUserCanAccess(id, userId);

    // 手動のみ削除可能
    if (transaction.paymentMethod !== "手動") {
      throw new Error("Forbidden: Only cash transactions can be deleted");
    }

    await this.transactionRepository.delete(id);
  }
}
