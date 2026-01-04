import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { IUserRepository } from "@/domain/repository/userRepository";
import { User } from "@/domain/entity/user";
import { CreateUserInput, Email, Password } from "@paypay-money-diary/shared";

export class UserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (result.length === 0) {
      return null;
    }

    const user = result[0];

    // DBレコードをUserエンティティに変換
    return new User(
      user.uuid,
      user.name,
      Email.create(user.email),
      Password.create(user.passwordHash),
      user.createdAt ?? undefined,
      user.updatedAt ?? undefined
    );
  }

  async findById(id: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.uuid, id)).limit(1);

    if (result.length === 0) {
      return null;
    }

    const user = result[0];

    // DBレコードをUserエンティティに変換
    return new User(
      user.uuid,
      user.name,
      Email.create(user.email),
      Password.create(user.passwordHash),
      user.createdAt ?? undefined,
      user.updatedAt ?? undefined
    );
  }

  async create(input: CreateUserInput & { passwordHash: string; uuid: string }): Promise<User> {
    const result = await db
      .insert(users)
      .values({
        uuid: input.uuid,
        name: input.name,
        email: input.email,
        passwordHash: input.passwordHash,
      })
      .returning();

    const user = result[0];

    // DBレコードをUserエンティティに変換
    return new User(
      user.uuid,
      user.name,
      Email.create(user.email),
      Password.create(user.passwordHash),
      user.createdAt ?? undefined,
      user.updatedAt ?? undefined
    );
  }
}
