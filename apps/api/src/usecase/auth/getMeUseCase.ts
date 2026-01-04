import { IUserRepository } from "@/domain/repository/userRepository";
import { User } from "@/domain/entity/user";

/**
 * Get Me Use Case
 * 現在のユーザー情報を取得するユースケースを実装
 */
export class GetMeUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    // Entityを返す
    return user;
  }
}
