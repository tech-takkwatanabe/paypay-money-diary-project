import { OpenAPIHono } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';
import { signupHandler } from '@/interface/http/auth/signup';
import { loginHandler } from '@/interface/http/auth/login';
import { meHandler } from '@/interface/http/auth/me';
import { refreshHandler } from '@/interface/http/auth/refresh';
import { logoutHandler } from '@/interface/http/auth/logout';
import { authMiddleware } from '@/interface/http/middleware/auth';
import { uploadCsvHandler } from '@/interface/http/transaction/upload';
import { getTransactionsHandler } from '@/interface/http/transaction/list';
import { getTransactionsSummaryHandler } from '@/interface/http/transaction/summary';
import { getCategoriesHandler } from '@/interface/http/category/list';
import { createCategoryHandler } from '@/interface/http/category/create';
import { updateCategoryHandler } from '@/interface/http/category/update';
import { deleteCategoryHandler } from '@/interface/http/category/delete';
import { signupRoute, loginRoute, refreshRoute, logoutRoute, meRoute } from '@/routes/auth.routes';

const app = new OpenAPIHono();

app.get('/', (c) => {
	return c.text('Hello Hono!');
});

const api = new OpenAPIHono();

// ===== 認証 API (OpenAPI 対応) =====
api.openapi(signupRoute, signupHandler);
api.openapi(loginRoute, loginHandler);
api.openapi(refreshRoute, refreshHandler);

// 認証必須エンドポイント（ミドルウェア適用）
api.use('/auth/logout', authMiddleware);
api.openapi(logoutRoute, logoutHandler);

api.use('/auth/me', authMiddleware);
api.openapi(meRoute, meHandler);

// ===== 取引 API (従来形式 - 後でOpenAPI対応予定) =====
api.post('/transactions/upload', authMiddleware, uploadCsvHandler);
api.get('/transactions', authMiddleware, getTransactionsHandler);
api.get('/transactions/summary', authMiddleware, getTransactionsSummaryHandler);

// ===== カテゴリ API (従来形式 - 後でOpenAPI対応予定) =====
api.get('/categories', authMiddleware, getCategoriesHandler);
api.post('/categories', authMiddleware, createCategoryHandler);
api.put('/categories/:id', authMiddleware, updateCategoryHandler);
api.delete('/categories/:id', authMiddleware, deleteCategoryHandler);

// ===== OpenAPI ドキュメント (開発環境のみ) =====
if (process.env.NODE_ENV !== 'production') {
	api.doc('/openapi.json', {
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
		security: [{ Bearer: [] }],
	});

	api.openAPIRegistry.registerComponent('securitySchemes', 'Bearer', {
		type: 'http',
		scheme: 'bearer',
		bearerFormat: 'JWT',
	});

	api.get('/docs', swaggerUI({ url: '/api/openapi.json' }));
}

// /api プレフィックスでマウント
app.route('/api', api);

const port = process.env.PORT || 8080;

export default {
	port,
	fetch: app.fetch,
	tls: {
		cert: Bun.file('../../.certificate/localhost-cert.pem'),
		key: Bun.file('../../.certificate/localhost-key.pem'),
	},
};

export { app };
