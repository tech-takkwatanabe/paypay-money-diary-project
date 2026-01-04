import { randomUUID } from "crypto";
import { IUserRepository } from "@/domain/repository/userRepository";
import { CreateUserInput } from "@paypay-money-diary/shared";
import { AuthService } from "@/service/auth/authService";
import { PasswordService } from "@/service/auth/passwordService";
import { User } from "@/domain/entity/user";

/**
 * Signup Use Case
 * ユーザー登録のユースケースを実装
 */
export class SignupUseCase {
  constructor(
    private userRepository: IUserRepository,
    private authService: AuthService,
    private passwordService: PasswordService
  ) {}

  async execute(input: CreateUserInput): Promise<User> {
    // 1. ユーザー存在チェック（Service層に委譲）
    const userExists = await this.authService.checkUserExists(input.email);
    if (userExists) {
      throw new Error("User already exists");
    }

    // 2. パスワードハッシュ化（Service層に委譲）
    const passwordHash = await this.passwordService.hashPassword(input.password);

    // 3. UUID生成
    const uuid = randomUUID();

    // 4. ユーザー作成
    const user = await this.userRepository.create({
      ...input,
      passwordHash,
      uuid,
    });

    // 5. Entityを返す
    return user;
  }
}
