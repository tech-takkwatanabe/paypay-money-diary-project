import { ITransactionRepository } from "@/domain/repository/transactionRepository";
import { CreateTransactionInput } from "@paypay-money-diary/shared";
import { ICategoryRepository } from "@/domain/repository/categoryRepository";

export class CreateTransactionUseCase {
  constructor(
    private transactionRepository: ITransactionRepository,
    private categoryRepository: ICategoryRepository
  ) {}

  async execute(userId: string, input: CreateTransactionInput) {
    // カテゴリ情報を取得
    const category = await this.categoryRepository.findById(input.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    const transaction = await this.transactionRepository.create({
      userId,
      date: new Date(input.date),
      amount: input.amount,
      description: input.description,
      categoryId: input.categoryId,
      categoryName: category.name,
      categoryColor: category.color,
      displayOrder: category.displayOrder,
      paymentMethod: "現金", // 手動入力は常に「現金」
    });

    return transaction.toResponse();
  }
}
