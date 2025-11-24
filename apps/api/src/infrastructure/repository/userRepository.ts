import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import { IUserRepository } from '@/domain/repository/userRepository';
import { User, CreateUserInput, Email, Password } from '@paypay-money-diary/shared';

export class UserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (result.length === 0) {
      return null;
    }

    const user = result[0];
    
    // Convert DB entity to Domain Entity (Value Objects)
    // Note: Password hash is not part of the shared User type for security in frontend, 
    // but might be needed for login. 
    // For now, mapping to shared User type which likely doesn't have passwordHash.
    // Let's check shared User type definition.
    
    return {
      id: user.uuid, // Use UUID as the main ID for the application
      name: user.name,
      email: Email.create(user.email),
      // Password is not exposed in User type usually, but if needed for login verification, 
      // we might need a different return type or method.
      // For findByEmail in context of signup (duplicate check), this is fine.
      // For login, we need the password hash.
      // Let's assume for now we return what matches User type.
      // Wait, User type in shared/src/schema/user.ts has password: PasswordSchema.
      // This implies it expects a Password object. 
      // But usually we don't return password to frontend.
      // The shared User type seems to be a full entity including password.
      // Let's map it.
      password: Password.create(user.passwordHash), 
    };
  }

  async create(input: CreateUserInput & { passwordHash: string; uuid: string }): Promise<User> {
    const result = await db.insert(users).values({
      uuid: input.uuid,
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
    }).returning();

    const user = result[0];

    return {
      id: user.uuid,
      name: user.name,
      email: Email.create(user.email),
      password: Password.create(user.passwordHash),
    };
  }
}
