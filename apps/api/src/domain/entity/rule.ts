/**
 * Rule Entity
 * ドメイン層のルールエンティティ
 */
export class Rule {
  constructor(
    public readonly id: string,
    public readonly userId: string | null,
    public readonly keyword: string,
    public readonly categoryId: string,
    public readonly priority: number,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
    public readonly categoryName: string | null = null
  ) {}

  /**
   * システムルールかどうか
   */
  get isSystem(): boolean {
    return this.userId === null;
  }

  /**
   * 指定されたユーザーに属しているかどうか
   */
  belongsToUser(userId: string): boolean {
    return this.userId === userId || this.isSystem;
  }

  /**
   * 指定された説明文にマッチするかどうか
   */
  matches(description: string): boolean {
    return description.toLowerCase().includes(this.keyword.toLowerCase());
  }

  /**
   * DTOに変換
   */
  toResponse() {
    return {
      id: this.id,
      userId: this.userId,
      keyword: this.keyword,
      categoryId: this.categoryId,
      categoryName: this.categoryName,
      priority: this.priority,
      isSystem: this.isSystem,
      createdAt: this.createdAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: this.updatedAt?.toISOString() ?? new Date().toISOString(),
    };
  }
}
