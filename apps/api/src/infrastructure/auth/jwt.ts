import jwt from "jsonwebtoken";

interface TokenPayload {
  userId: string;
  email: string;
}

interface JWTConfig {
  accessSecret: string;
  refreshSecret: string;
  accessExpiresIn: string;
  refreshExpiresIn: string;
}

const getConfig = (): JWTConfig => {
  const accessSecret = process.env.JWT_ACCESS_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!accessSecret || !refreshSecret) {
    throw new Error("JWT secrets are not configured");
  }

  return {
    accessSecret,
    refreshSecret,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  };
};

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
