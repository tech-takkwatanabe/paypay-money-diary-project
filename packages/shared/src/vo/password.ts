import { z } from "zod";

// Password Value Object
export class Password {
  public readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  public static create(password: string): Password {
    return new Password(password);
  }

  public equals(other: Password): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    // Be careful not to log passwords
    return "********";
  }
}

export const PasswordSchema = z
  .string()
  .min(8, { message: "パスワードは8文字以上である必要があります。" })
  .transform((password) => Password.create(password));

export type PasswordType = z.infer<typeof PasswordSchema>;
