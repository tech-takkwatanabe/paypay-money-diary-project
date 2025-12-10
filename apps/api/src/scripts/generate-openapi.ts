/**
 * OpenAPI YAML エクスポートスクリプト
 * 使用方法: bun run src/scripts/generate-openapi.ts
 */

import { OpenAPIHono } from '@hono/zod-openapi';
import { signupRoute, loginRoute, refreshRoute, logoutRoute, meRoute } from '@/routes/auth.routes';
import YAML from 'yaml';
import fs from 'fs';

const app = new OpenAPIHono();

// ルートを登録
app.openapi(signupRoute, async (c) => c.json({}));
app.openapi(loginRoute, async (c) => c.json({}));
app.openapi(refreshRoute, async (c) => c.json({}));
app.openapi(logoutRoute, async (c) => c.json({}));
app.openapi(meRoute, async (c) => c.json({}));

// セキュリティスキームを登録
app.openAPIRegistry.registerComponent('securitySchemes', 'Bearer', {
	type: 'http',
	scheme: 'bearer',
	bearerFormat: 'JWT',
});

// OpenAPI ドキュメントを取得
const doc = app.getOpenAPIDocument({
	openapi: '3.1.0',
	info: {
		title: 'PayPay Money Diary API',
		version: '1.0.0',
		description: 'PayPay 家計簿アプリケーション API',
	},
	servers: [
		{
			url: 'https://localhost:8080/api',
			description: 'Development server',
		},
	],
});

// YAML に変換して出力
const yamlContent = YAML.stringify(doc);
fs.writeFileSync('openapi.yml', yamlContent);
console.log('✅ openapi.yml を生成しました');
