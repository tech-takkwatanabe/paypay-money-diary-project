/**
 * Transaction Entity
 * ドメイン層のトランザクションエンティティ
 */
export class Transaction {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly date: Date,
    public readonly description: string,
    public readonly amount: number,
    public readonly categoryId: string | null,
    public readonly categoryName: string,
    public readonly categoryColor: string,
    public readonly displayOrder: number = 0,
    public readonly paymentMethod: string | null = null,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date
  ) {}

  /**
   * 指定されたユーザーに属しているかどうか
   */
  belongsToUser(userId: string): boolean {
    return this.userId === userId;
  }

  /**
   * 指定された年月に属しているかどうか
   */
  belongsToYearMonth(year: number, month?: number): boolean {
    const transactionYear = this.date.getFullYear();
    const transactionMonth = this.date.getMonth() + 1;

    if (month !== undefined) {
      return transactionYear === year && transactionMonth === month;
    }
    return transactionYear === year;
  }

  /**
   * 指定されたカテゴリに属しているかどうか
   */
  belongsToCategory(categoryId: string | null): boolean {
    return this.categoryId === categoryId;
  }

  /**
   * カテゴリを変更
   */
  changeCategory(categoryId: string | null, categoryName: string, categoryColor: string): Transaction {
    return new Transaction(
      this.id,
      this.userId,
      this.date,
      this.description,
      this.amount,
      categoryId,
      categoryName,
      categoryColor,
      this.displayOrder,
      this.paymentMethod,
      this.createdAt,
      new Date()
    );
  }

  /**
   * DTOに変換
   */
  toResponse() {
    return {
      id: this.id,
      userId: this.userId,
      date: this.date.toISOString(),
      description: this.description,
      amount: this.amount,
      categoryId: this.categoryId,
      categoryName: this.categoryName,
      categoryColor: this.categoryColor,
      displayOrder: this.displayOrder,
      paymentMethod: this.paymentMethod,
      createdAt: this.createdAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: this.updatedAt?.toISOString() ?? new Date().toISOString(),
    };
  }
}
