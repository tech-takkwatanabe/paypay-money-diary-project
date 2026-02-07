import { User } from "@/domain/entity/user";
import { CreateUserInput } from "@paypay-money-diary/shared";

export type IUserRepository = {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(input: CreateUserInput & { passwordHash: string; uuid: string }): Promise<User>;
  delete(id: string): Promise<void>;
};
