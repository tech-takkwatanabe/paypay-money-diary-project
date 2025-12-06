import { Context } from "hono";
import { LogoutUseCase } from "@/usecase/auth/logoutUseCase";

import { RedisTokenRepository } from "@/infrastructure/repository/tokenRepository";

export const logoutHandler = async (c: Context) => {
  const userPayload = c.get("user");

  if (!userPayload || !userPayload.userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const tokenRepository = new RedisTokenRepository();
  const logoutUseCase = new LogoutUseCase(tokenRepository);

  try {
    await logoutUseCase.execute(userPayload.userId);
    return c.json({ message: "Logged out successfully" }, 200);
  } catch (error) {
    console.error(error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
};
