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
    const transaction = await this.transactionService.ensureUserCanAccess(id, userId);

    // 金額を更新する場合、手動のみ許可
    if (input.amount !== undefined && transaction.paymentMethod !== "手動") {
      throw new Error("Forbidden: Only amount of cash transactions can be updated");
    }

    // 店名・内容を更新する場合、手動のみ許可
    if (input.description !== undefined && transaction.paymentMethod !== "手動") {
      throw new Error("Forbidden: Only description of cash transactions can be updated");
    }

    // 日付を更新する場合、手動のみ許可
    if (input.date !== undefined && transaction.paymentMethod !== "手動") {
      throw new Error("Forbidden: Only date of cash transactions can be updated");
    }

    const updatedTransaction = await this.transactionRepository.update(id, input);
    return updatedTransaction.toResponse();
  }
}
