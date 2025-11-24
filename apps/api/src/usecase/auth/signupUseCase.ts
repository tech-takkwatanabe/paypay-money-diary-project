import { hash } from 'bcryptjs';
import { randomUUID } from 'crypto';
import { IUserRepository } from '@/domain/repository/userRepository';
import { CreateUserInput, UserResponse } from '@paypay-money-diary/shared';

export class SignupUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(input: CreateUserInput): Promise<UserResponse> {
    // 1. Check if user already exists
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // 2. Hash password
    const passwordHash = await hash(input.password, 10);

    // 3. Generate UUID
    const uuid = randomUUID();

    // 4. Create user
    const user = await this.userRepository.create({
      ...input,
      passwordHash,
      uuid,
    });

    // 5. Return user without password (convert Email VO to string)
    return {
      id: user.id!,
      name: user.name,
      email: user.email.toString(),
    };
  }
}
