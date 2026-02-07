/**
 * Category Entity
 * ドメイン層のカテゴリエンティティ
 */
type CategoryProps = {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  displayOrder: number;
  isDefault: boolean;
  isOther: boolean;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
  hasRules?: boolean;
  hasTransactions?: boolean;
};

export class Category {
  public readonly id: string;
  public readonly name: string;
  public readonly color: string;
  public readonly icon: string | null;
  public readonly displayOrder: number;
  public readonly isDefault: boolean;
  public readonly isOther: boolean;
  public readonly userId: string;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
  public readonly hasRules: boolean;
  public readonly hasTransactions: boolean;

  constructor(props: CategoryProps) {
    this.id = props.id;
    this.name = props.name;
    this.color = props.color;
    this.icon = props.icon;
    this.displayOrder = props.displayOrder;
    this.isDefault = props.isDefault;
    this.isOther = props.isOther;
    this.userId = props.userId;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.hasRules = props.hasRules ?? false;
    this.hasTransactions = props.hasTransactions ?? false;
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
      isOther: this.isOther,
      userId: this.userId,
      hasRules: this.hasRules,
      hasTransactions: this.hasTransactions,
    };
  }
}
