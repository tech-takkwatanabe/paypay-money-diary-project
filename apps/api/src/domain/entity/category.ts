/**
 * Category Entity
 * ドメイン層のカテゴリエンティティ
 */
export class Category {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly color: string,
    public readonly icon: string | null,
    public readonly displayOrder: number,
    public readonly isDefault: boolean,
    public readonly userId: string | null,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
    public readonly hasRules: boolean = false
  ) {}

  /**
   * システムカテゴリかどうか
   */
  isSystemCategory(): boolean {
    return this.userId === null;
  }

  /**
   * 指定されたユーザーに属しているかどうか
   */
  belongsToUser(userId: string): boolean {
    return this.userId === userId;
  }

  /**
   * 削除可能かどうか
   */
  canDelete(): boolean {
    // ビジネスルール: デフォルトカテゴリは削除できない
    // ルールが紐づいているカテゴリも削除できない（ユースケースでチェックするが、エンティティとしても状態を持つ）
    return !this.isDefault && !this.hasRules;
  }

  /**
   * DTOに変換
   */
  toResponse() {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
      icon: this.icon,
      displayOrder: this.displayOrder,
      isDefault: this.isDefault,
      isSystem: this.isSystemCategory(),
      userId: this.userId,
      hasRules: this.hasRules,
    };
  }
}
