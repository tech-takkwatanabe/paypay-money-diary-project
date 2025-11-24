import { User, CreateUserInput } from '@paypay-money-diary/shared';

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  create(user: CreateUserInput & { passwordHash: string; uuid: string }): Promise<User>;
}
