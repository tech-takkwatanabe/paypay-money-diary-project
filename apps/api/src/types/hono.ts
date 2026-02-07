export type TokenPayload = {
  userId: string;
  email: string;
};

export type Env = {
  Variables: {
    user: TokenPayload;
  };
};
