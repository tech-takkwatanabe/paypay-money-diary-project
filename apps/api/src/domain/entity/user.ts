import { Email, Password } from "@paypay-money-diary/shared";

/**
 * User Entity
 * ドメイン層のユーザーエンティティ
 */
export class User {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: Email,
    public readonly password: Password,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date
  ) {}

  /**
   * パスワード変更可能かどうか
   */
  canChangePassword(): boolean {
    // ビジネスルール: すべてのユーザーはパスワードを変更できる
    return true;
  }

  /**
   * DTOに変換（パスワードなし）
   */
  toResponse() {
    return {
      id: this.id,
      name: this.name,
      email: this.email.toString(),
    };
  }
}
