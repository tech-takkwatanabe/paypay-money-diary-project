import { Context } from "hono";
import { GetMeUseCase } from "@/usecase/auth/getMeUseCase";
import { UserRepository } from "@/infrastructure/repository/userRepository";

export const meHandler = async (c: Context) => {
  const userPayload = c.get("user");

  if (!userPayload || !userPayload.userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const userRepository = new UserRepository();
  const getMeUseCase = new GetMeUseCase(userRepository);

  try {
    const user = await getMeUseCase.execute(userPayload.userId);
    return c.json(user, 200);
  } catch (error) {
    console.error(error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
};
