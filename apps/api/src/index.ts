import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { cors } from "hono/cors";
import { authMiddleware } from "@/middleware/auth";

import { registerAuthRoutes } from "@/controller/auth/auth.routes";
import { registerCategoryRoutes } from "@/controller/category/category.routes";
import { registerRuleRoutes } from "@/controller/rule/rule.routes";
import { registerTransactionRoutes } from "@/controller/transaction/transaction.routes";

import { Env } from "@/types/hono";

const app = new OpenAPIHono<Env>();

// CORS 設定 (Cookie 認証に必要)
app.use(
  "*",
  cors({
    origin: process.env.FRONTEND_URL || "https://localhost:3000",
    credentials: true, // Cookie 送信を許可
  })
);

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

const api = new OpenAPIHono<Env>();

// ===== OpenAPI ドキュメント (開発環境のみ) =====
// ミドルウェアの影響を避けるため、先に定義
if (process.env.NODE_ENV !== "production") {
  api.doc("/openapi.json", {
    openapi: "3.1.0",
    info: {
      title: "PayPay Money Diary API",
      version: "1.0.0",
      description: "PayPay 家計簿アプリケーション API (HttpOnly Cookie 認証)",
    },
    servers: [
      {
        url: process.env.API_URL ? `${process.env.API_URL}/api` : "http://localhost:8080/api",
        description: "Development server",
      },
    ],
  });

  // Cookie 認証スキーマを登録
  api.openAPIRegistry.registerComponent("securitySchemes", "Cookie", {
    type: "apiKey",
    in: "cookie",
    name: "accessToken",
    description: "HttpOnly Cookie に設定されたアクセストークン",
  });

  // /api/docs からの相対パスで指定
  api.get("/docs", swaggerUI({ url: "./openapi.json" }));
}

// ===== 認証 API (OpenAPI 対応) =====
api.use("/auth/logout", authMiddleware);
api.use("/auth/me", authMiddleware);
registerAuthRoutes(api);

// ===== 取引 API (OpenAPI 対応) =====
api.use("/transactions", authMiddleware);
api.use("/transactions/*", authMiddleware);
registerTransactionRoutes(api);

// ===== カテゴリ API (OpenAPI 対応) =====
api.use("/categories", authMiddleware);
api.use("/categories/*", authMiddleware);
registerCategoryRoutes(api);

// ===== ルール API (OpenAPI 対応) =====
api.use("/rules", authMiddleware);
api.use("/rules/*", authMiddleware);
registerRuleRoutes(api);

// /api プレフィックスでマウント
app.route("/api", api);

const port = process.env.PORT || 8080;

export default {
  port,
  fetch: app.fetch,
  tls: {
    cert: Bun.file("../../.certificate/localhost-cert.pem"),
    key: Bun.file("../../.certificate/localhost-key.pem"),
  },
};

export { app };
