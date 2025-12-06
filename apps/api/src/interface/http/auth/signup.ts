import { Context } from "hono";
import { SignupUseCase } from "@/usecase/auth/signupUseCase";
import { UserRepository } from "@/infrastructure/repository/userRepository";
import { CreateUserInput } from "@paypay-money-diary/shared";

export const signupHandler = async (c: Context) => {
  // Dependency Injection (Manual for now)
  const userRepository = new UserRepository();
  const signupUseCase = new SignupUseCase(userRepository);

  // Input is already validated by zValidator middleware in the route definition
  const input = c.req.valid("json" as never) as CreateUserInput;

  try {
    const user = await signupUseCase.execute(input);
    return c.json(user, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "User already exists") {
      return c.json({ error: "User already exists" }, 409);
    }
    console.error(error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
};
