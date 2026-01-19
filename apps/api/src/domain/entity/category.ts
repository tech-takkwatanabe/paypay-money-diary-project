/**
 * Category Entity
 * ドメイン層のカテゴリエンティティ
 */
export class Category {
  public readonly id: string;
  public readonly name: string;
  public readonly color: string;
  public readonly icon: string | null;
  public readonly displayOrder: number;
  public readonly isDefault: boolean;
  public readonly userId: string | null;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
  public readonly hasRules: boolean;
  public readonly hasTransactions: boolean;

  constructor(
    id: string,
    name: string,
    color: string,
    icon: string | null,
    displayOrder: number,
    isDefault: boolean,
    userId: string | null,
    createdAt?: Date,
    updatedAt?: Date,
    hasRules: boolean = false,
    hasTransactions: boolean = false
  ) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.icon = icon;
    this.displayOrder = displayOrder;
    this.isDefault = isDefault;
    this.userId = userId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.hasRules = hasRules;
    this.hasTransactions = hasTransactions;
  }

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
   * カテゴリが削除可能かどうかを判定
   * - デフォルトカテゴリは削除不可
   * - ルールに使用されているカテゴリは削除不可
   * - 支出データが存在するカテゴリは削除不可
   */
  public canDelete(): boolean {
    return !this.isDefault && !this.hasRules && !this.hasTransactions;
  }

  /**
   * レスポンス用のオブジェクトに変換
   */
  public toResponse() {
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
      hasTransactions: this.hasTransactions,
    };
  }
}
