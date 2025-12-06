export interface ITokenRepository {
  saveRefreshToken(_userId: string, _token: string): Promise<void>;
  findRefreshToken(userId: string): Promise<string | null>;
  deleteRefreshToken(userId: string): Promise<void>;
}
