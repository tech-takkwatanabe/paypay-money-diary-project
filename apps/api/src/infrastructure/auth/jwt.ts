import jwt from "jsonwebtoken";
import { getConfig } from "@/infrastructure/auth/config";

interface TokenPayload {
  userId: string;
  email: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  const config = getConfig();
  return jwt.sign(payload, config.accessSecret, {
    expiresIn: config.accessExpiresIn,
  } as jwt.SignOptions);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  const config = getConfig();
  return jwt.sign(payload, config.refreshSecret, {
    expiresIn: config.refreshExpiresIn,
  } as jwt.SignOptions);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  const config = getConfig();
  return jwt.verify(token, config.accessSecret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  const config = getConfig();
  return jwt.verify(token, config.refreshSecret) as TokenPayload;
};
