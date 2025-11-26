import { User, CreateUserInput } from '@paypay-money-diary/shared';

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(input: CreateUserInput & { passwordHash: string; uuid: string }): Promise<User>;
}
