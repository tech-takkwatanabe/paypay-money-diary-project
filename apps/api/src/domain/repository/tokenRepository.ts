export interface ITokenRepository {
  saveRefreshToken(userId: string, token: string): Promise<void>;
  findRefreshToken(userId: string): Promise<string | null>;
  deleteRefreshToken(userId: string): Promise<void>;
}
