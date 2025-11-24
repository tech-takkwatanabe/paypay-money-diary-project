import { z } from 'zod';

// Email Value Object
export class Email {
  public readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  public static create(email: string): Email {
    // Additional business logic can go here
    return new Email(email);
  }

  public equals(other: Email): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}

// Zod Schema with transformation to Value Object
export const EmailSchema = z
  .string()
  .email({ message: "無効なメールアドレス形式です。" })
  .transform((email) => Email.create(email));

export type EmailType = z.infer<typeof EmailSchema>;
