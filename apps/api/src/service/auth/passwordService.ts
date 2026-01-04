import { compare, hash } from "bcryptjs";

/**
 * Password Service
 * パスワードのハッシュ化と検証を担当
 */
export class PasswordService {
  /**
   * パスワードをハッシュ化
   */
  async hashPassword(password: string): Promise<string> {
    return hash(password, 10);
  }

  /**
   * パスワードを検証
   */
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return compare(password, hashedPassword);
  }
}
