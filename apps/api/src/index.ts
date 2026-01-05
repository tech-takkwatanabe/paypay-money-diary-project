import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { cors } from "hono/cors";
import { authMiddleware } from "@/interface/http/middleware/auth";

// Handlers
import {
  uploadCsvHandler,
  getTransactionsHandler,
  getTransactionsSummaryHandler,
  getAvailableYearsHandler,
  reCategorizeHandler,
  updateTransactionHandler,
} from "@/interface/http/transaction";
import { registerAuthRoutes } from "@/controller/auth/auth.routes";
import { registerCategoryRoutes } from "@/controller/category/category.routes";
import { registerRuleRoutes } from "@/controller/rule/rule.routes";
import {
  uploadCsvRoute,
  getTransactionsRoute,
  getSummaryRoute,
  getAvailableYearsRoute,
  reCategorizeRoute,
  updateTransactionRoute,
} from "@/routes/transaction.routes";
const app = new OpenAPIHono();

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

const api = new OpenAPIHono();

// ===== 認証 API (OpenAPI 対応) =====
api.use("/auth/logout", authMiddleware);
api.use("/auth/me", authMiddleware);
registerAuthRoutes(api);

// ===== 取引 API =====
api.use("/transactions/*", authMiddleware);
api.openapi(uploadCsvRoute, uploadCsvHandler);
api.openapi(getTransactionsRoute, getTransactionsHandler);
api.openapi(getSummaryRoute, getTransactionsSummaryHandler);
api.openapi(getAvailableYearsRoute, getAvailableYearsHandler);
api.openapi(reCategorizeRoute, reCategorizeHandler);
api.openapi(updateTransactionRoute, updateTransactionHandler);

// ===== カテゴリ API (OpenAPI 対応) =====
api.use("/categories", authMiddleware);
api.use("/categories/*", authMiddleware);
registerCategoryRoutes(api);

// ===== ルール API (OpenAPI 対応) =====
api.use("/rules", authMiddleware);
api.use("/rules/*", authMiddleware);
registerRuleRoutes(api);

// ===== OpenAPI ドキュメント (開発環境のみ) =====
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
        url: `${process.env.API_URL}/api`,
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

  api.get("/docs", swaggerUI({ url: "/api/openapi.json" }));
}

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
