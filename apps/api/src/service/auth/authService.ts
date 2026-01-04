import { IUserRepository } from "@/domain/repository/userRepository";
import { User } from "@/domain/entity/user";
import { PasswordService } from "./passwordService";

/**
 * Auth Service
 * 認証関連のビジネスロジックを担当
 */
export class AuthService {
  constructor(
    private userRepository: IUserRepository,
    private passwordService: PasswordService
  ) {}

  /**
   * メールアドレスとパスワードでユーザーを認証
   */
  async authenticateUser(email: string, password: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isPasswordValid = await this.passwordService.verifyPassword(password, user.password.value);
    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    return user;
  }

  /**
   * ユーザーが既に存在するかチェック
   */
  async checkUserExists(email: string): Promise<boolean> {
    const user = await this.userRepository.findByEmail(email);
    return user !== null;
  }
}
