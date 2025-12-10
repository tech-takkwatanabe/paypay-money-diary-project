/**
 * OpenAPI YAML エクスポートスクリプト
 * 使用方法: bun run src/scripts/generate-openapi.ts
 */

import { OpenAPIHono } from '@hono/zod-openapi';
import { signupRoute, loginRoute, refreshRoute, logoutRoute, meRoute, type SignupRoute, type LoginRoute, type RefreshRoute, type LogoutRoute, type MeRoute } from '@/routes/auth.routes';
import type { RouteHandler } from '@hono/zod-openapi';
import YAML from 'yaml';
import fs from 'fs';

const app = new OpenAPIHono();

// ダミーハンドラーを型安全に定義
const signupDummy: RouteHandler<SignupRoute> = async (c) => {
	return c.json({ id: '', name: '', email: '' }, 201);
};

const loginDummy: RouteHandler<LoginRoute> = async (c) => {
	return c.json(
		{
			accessToken: '',
			refreshToken: '',
			user: { id: '', name: '', email: '' },
		},
		200
	);
};

const refreshDummy: RouteHandler<RefreshRoute> = async (c) => {
	return c.json({ accessToken: '', refreshToken: '' }, 200);
};

const logoutDummy: RouteHandler<LogoutRoute> = async (c) => {
	return c.json({ message: '' }, 200);
};

const meDummy: RouteHandler<MeRoute> = async (c) => {
	return c.json({ id: '', name: '', email: '' }, 200);
};

// ルートを登録
app.openapi(signupRoute, signupDummy);
app.openapi(loginRoute, loginDummy);
app.openapi(refreshRoute, refreshDummy);
app.openapi(logoutRoute, logoutDummy);
app.openapi(meRoute, meDummy);

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
