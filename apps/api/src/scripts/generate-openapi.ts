/**
 * OpenAPI YAML エクスポートスクリプト
 * 使用方法: bun run src/scripts/generate-openapi.ts
 *
 * NOTE: 認証APIはOpenAPIHono対応済み、取引・カテゴリAPIはスキーマ定義のみ
 */

import { OpenAPIHono } from "@hono/zod-openapi";
import type { RouteHandler } from "@hono/zod-openapi";
import YAML from "yaml";
import fs from "fs";

// Auth routes
import {
  signupRoute,
  loginRoute,
  refreshRoute,
  logoutRoute,
  meRoute,
  type SignupRoute,
  type LoginRoute,
  type RefreshRoute,
  type LogoutRoute,
  type MeRoute,
} from "@/controller/auth/auth.routes";

// Transaction routes (スキーマ定義のみ)
import {
  uploadCsvRoute,
  getTransactionsRoute,
  getSummaryRoute,
  getAvailableYearsRoute,
  reCategorizeRoute,
  updateTransactionRoute,
  type UploadCsvRoute,
  type GetTransactionsRoute,
  type GetSummaryRoute,
  type GetAvailableYearsRoute,
  type ReCategorizeRoute,
  type UpdateTransactionRoute,
} from "@/routes/transaction.routes";

// Category routes (スキーマ定義のみ)
import {
  getCategoriesRoute,
  createCategoryRoute,
  updateCategoryRoute,
  deleteCategoryRoute,
  type GetCategoriesRoute,
  type CreateCategoryRoute,
  type UpdateCategoryRoute,
  type DeleteCategoryRoute,
} from "@/routes/category.routes";

// Rule routes
import {
  getRulesRoute,
  createRuleRoute,
  updateRuleRoute,
  deleteRuleRoute,
  type GetRulesRoute,
  type CreateRuleRoute,
  type UpdateRuleRoute,
  type DeleteRuleRoute,
} from "@/routes/rule.routes";

const app = new OpenAPIHono();

// ===== Auth dummy handlers =====
const signupDummy: RouteHandler<SignupRoute> = async (c) => {
  return c.json({ id: "", name: "", email: "" }, 201);
};

const loginDummy: RouteHandler<LoginRoute> = async (c) => {
  return c.json(
    {
      accessToken: "",
      refreshToken: "",
      user: { id: "", name: "", email: "" },
    },
    200
  );
};

const refreshDummy: RouteHandler<RefreshRoute> = async (c) => {
  return c.json({ message: "" }, 200);
};

const logoutDummy: RouteHandler<LogoutRoute> = async (c) => {
  return c.json({ message: "" }, 200);
};

const meDummy: RouteHandler<MeRoute> = async (c) => {
  return c.json({ id: "", name: "", email: "" }, 200);
};

// ===== Transaction dummy handlers =====
const uploadCsvDummy: RouteHandler<UploadCsvRoute> = async (c) => {
  return c.json(
    {
      message: "",
      uploadId: "",
      totalRows: 0,
      importedRows: 0,
      skippedRows: 0,
      duplicateRows: 0,
    },
    201
  );
};

const getTransactionsDummy: RouteHandler<GetTransactionsRoute> = async (c) => {
  return c.json(
    {
      data: [],
      pagination: { page: 1, limit: 50, totalCount: 0, totalPages: 0 },
    },
    200
  );
};

const getSummaryDummy: RouteHandler<GetSummaryRoute> = async (c) => {
  return c.json(
    {
      summary: { totalAmount: 0, transactionCount: 0 },
      categoryBreakdown: [],
      monthlyBreakdown: [],
    },
    200
  );
};

const getAvailableYearsDummy: RouteHandler<GetAvailableYearsRoute> = async (c) => {
  return c.json({ years: [] }, 200);
};

const reCategorizeDummy: RouteHandler<ReCategorizeRoute> = async (c) => {
  return c.json({ message: "" }, 200);
};

const updateTransactionDummy: RouteHandler<UpdateTransactionRoute> = async (c) => {
  return c.json(
    {
      id: "",
      transactionDate: "",
      amount: 0,
      merchant: "",
      paymentMethod: null,
      categoryId: null,
      categoryName: null,
      categoryColor: null,
    },
    200
  );
};

// ===== Category dummy handlers =====
const getCategoriesDummy: RouteHandler<GetCategoriesRoute> = async (c) => {
  return c.json({ data: [] }, 200);
};

const createCategoryDummy: RouteHandler<CreateCategoryRoute> = async (c) => {
  return c.json(
    {
      id: "",
      name: "",
      color: "",
      icon: null,
      displayOrder: 0,
      isDefault: false,
    },
    201
  );
};

const updateCategoryDummy: RouteHandler<UpdateCategoryRoute> = async (c) => {
  return c.json(
    {
      id: "",
      name: "",
      color: "",
      icon: null,
      displayOrder: 0,
      isDefault: false,
    },
    200
  );
};

const deleteCategoryDummy: RouteHandler<DeleteCategoryRoute> = async (c) => {
  return c.json({ message: "" }, 200);
};

// ===== Rule dummy handlers =====
const getRulesDummy: RouteHandler<GetRulesRoute> = async (c) => {
  return c.json({ data: [] }, 200);
};

const createRuleDummy: RouteHandler<CreateRuleRoute> = async (c) => {
  return c.json(
    {
      id: "",
      keyword: "",
      categoryId: "",
      categoryName: "",
      priority: 0,
      isSystem: false,
    },
    201
  );
};

const updateRuleDummy: RouteHandler<UpdateRuleRoute> = async (c) => {
  return c.json(
    {
      id: "",
      keyword: "",
      categoryId: "",
      categoryName: "",
      priority: 0,
      isSystem: false,
    },
    200
  );
};

const deleteRuleDummy: RouteHandler<DeleteRuleRoute> = async (c) => {
  return c.json({ message: "" }, 200);
};

// Register all routes
app.openapi(signupRoute, signupDummy);
app.openapi(loginRoute, loginDummy);
app.openapi(refreshRoute, refreshDummy);
app.openapi(logoutRoute, logoutDummy);
app.openapi(meRoute, meDummy);

app.openapi(uploadCsvRoute, uploadCsvDummy);
app.openapi(getTransactionsRoute, getTransactionsDummy);
app.openapi(getSummaryRoute, getSummaryDummy);
app.openapi(getAvailableYearsRoute, getAvailableYearsDummy);
app.openapi(reCategorizeRoute, reCategorizeDummy);
app.openapi(updateTransactionRoute, updateTransactionDummy);

app.openapi(getCategoriesRoute, getCategoriesDummy);
app.openapi(createCategoryRoute, createCategoryDummy);
app.openapi(updateCategoryRoute, updateCategoryDummy);
app.openapi(deleteCategoryRoute, deleteCategoryDummy);

app.openapi(getRulesRoute, getRulesDummy);
app.openapi(createRuleRoute, createRuleDummy);
app.openapi(updateRuleRoute, updateRuleDummy);
app.openapi(deleteRuleRoute, deleteRuleDummy);

// Register security scheme
app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

// Generate OpenAPI document
const doc = app.getOpenAPIDocument({
  openapi: "3.1.0",
  info: {
    title: "PayPay Money Diary API",
    version: "1.0.0",
    description: "PayPay 家計簿アプリケーション API",
  },
  servers: [
    {
      url: "https://localhost:8080/api",
      description: "Development server",
    },
  ],
});

// Export to YAML
const yamlContent = YAML.stringify(doc);
fs.writeFileSync("openapi.yml", yamlContent);
console.log("✅ openapi.yml を生成しました");
console.log("📝 認証API: 5エンドポイント");
console.log("📝 取引API: 4エンドポイント");
console.log("📝 カテゴリAPI: 4エンドポイント");
console.log("📝 ルールAPI: 4エンドポイント");
