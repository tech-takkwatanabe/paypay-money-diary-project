import { TokenPayload } from "./token";

export type Env = {
  Variables: {
    user: TokenPayload;
  };
};
