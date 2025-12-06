import { IUserRepository } from "@/domain/repository/userRepository";
import { UserResponse } from "@paypay-money-diary/shared";

export class GetMeUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(userId: string): Promise<UserResponse> {
    // We don't have findById in IUserRepository yet, let's assume we might need to add it or use findByEmail if we had email.
    // But wait, the token payload has userId.
    // Let's check IUserRepository. It only has findByEmail and create.
    // We need to add findById to IUserRepository.

    // For now, let's implement the logic assuming findById exists, and I will update the repository interface/implementation in the next step.
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    return {
      id: user.id!,
      name: user.name,
      email: user.email.toString(),
    };
  }
}
