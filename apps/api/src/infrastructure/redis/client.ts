import Redis from "ioredis";

/**
 * Redis クライアントのプロキシクラス
 * テスト実行時に不要な接続が発生するのを防ぎ、かつ spyOn 可能にする
 */
class RedisProxy {
  private _instance: Redis | null = null;

  private get instance(): Redis {
    if (!this._instance) {
      const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
      this._instance = new Redis(redisUrl);

      this._instance.on("error", (err) => {
        if (process.env.NODE_ENV !== "test") {
          console.error("Redis connection error:", err);
        }
      });

      this._instance.on("connect", () => {
        if (process.env.NODE_ENV !== "test") {
          console.log("Connected to Redis");
        }
      });
    }
    return this._instance;
  }

  // 使用しているメソッドのみをプロキシ
  async get(key: string): Promise<string | null> {
    return this.instance.get(key);
  }

  async setex(key: string, seconds: number, value: string): Promise<string> {
    return this.instance.setex(key, seconds, value);
  }

  async del(...keys: string[]): Promise<number> {
    return this.instance.del(...keys);
  }

  on(event: string, listener: (...args: unknown[]) => void): this {
    this.instance.on(event, listener);
    return this;
  }
}

export const redis = new RedisProxy() as unknown as Redis;
