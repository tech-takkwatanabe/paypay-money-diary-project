import { OpenAPIHono } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';
import { cors } from 'hono/cors';
import { signupHandler } from '@/interface/http/auth/signup';
import { loginHandler } from '@/interface/http/auth/login';
import { meHandler } from '@/interface/http/auth/me';
import { refreshHandler } from '@/interface/http/auth/refresh';
import { logoutHandler } from '@/interface/http/auth/logout';
import { authMiddleware } from '@/interface/http/middleware/auth';
import { uploadCsvHandler } from '@/interface/http/transaction/upload';
import { getTransactionsHandler } from '@/interface/http/transaction/list';
import { getTransactionsSummaryHandler } from '@/interface/http/transaction/summary';
import { getAvailableYearsHandler } from '@/interface/http/transaction/availableYears';
import { reCategorizeHandler } from '@/interface/http/transaction/reCategorize';
import { getCategoriesHandler } from '@/interface/http/category/list';
import { createCategoryHandler } from '@/interface/http/category/create';
import { updateCategoryHandler } from '@/interface/http/category/update';
import { deleteCategoryHandler } from '@/interface/http/category/delete';
import { getRulesHandler } from '@/interface/http/rule/list';
import { createRuleHandler } from '@/interface/http/rule/create';
import { updateRuleHandler } from '@/interface/http/rule/update';
import { deleteRuleHandler } from '@/interface/http/rule/delete';

// OpenAPI Route definitions
import { signupRoute, loginRoute, refreshRoute, logoutRoute, meRoute } from '@/routes/auth.routes';
import { getRulesRoute, createRuleRoute, updateRuleRoute, deleteRuleRoute } from '@/routes/rule.routes';

const app = new OpenAPIHono();

// CORS 設定 (Cookie 認証に必要)
app.use(
	'*',
	cors({
		origin: process.env.FRONTEND_URL || 'https://localhost:3000',
		credentials: true, // Cookie 送信を許可
	})
);

app.get('/', (c) => {
	return c.text('Hello Hono!');
});

const api = new OpenAPIHono();

// ===== 認証 API (OpenAPI 対応) =====
api.openapi(signupRoute, signupHandler);
api.openapi(loginRoute, loginHandler);
api.openapi(refreshRoute, refreshHandler);

// 認証必須エンドポイント
api.use('/auth/logout', authMiddleware);
api.openapi(logoutRoute, logoutHandler);

api.use('/auth/me', authMiddleware);
api.openapi(meRoute, meHandler);

// ===== 取引 API =====
api.post('/transactions/upload', authMiddleware, uploadCsvHandler);
api.get('/transactions', authMiddleware, getTransactionsHandler);
api.get('/transactions/summary', authMiddleware, getTransactionsSummaryHandler);
api.get('/transactions/years', authMiddleware, getAvailableYearsHandler);
api.post('/transactions/re-categorize', authMiddleware, reCategorizeHandler);

// ===== カテゴリ API =====
api.get('/categories', authMiddleware, getCategoriesHandler);
api.post('/categories', authMiddleware, createCategoryHandler);
api.put('/categories/:id', authMiddleware, updateCategoryHandler);
api.delete('/categories/:id', authMiddleware, deleteCategoryHandler);

// ===== ルール API =====
api.openapi(getRulesRoute, getRulesHandler);
api.openapi(createRuleRoute, createRuleHandler);
api.openapi(updateRuleRoute, updateRuleHandler);
api.openapi(deleteRuleRoute, deleteRuleHandler);

// ===== OpenAPI ドキュメント (開発環境のみ) =====
if (process.env.NODE_ENV !== 'production') {
	api.doc('/openapi.json', {
		openapi: '3.1.0',
		info: {
			title: 'PayPay Money Diary API',
			version: '1.0.0',
			description: 'PayPay 家計簿アプリケーション API (HttpOnly Cookie 認証)',
		},
		servers: [
			{
				url: `${process.env.API_URL}/api`,
				description: 'Development server',
			},
		],
	});

	// Cookie 認証スキーマを登録
	api.openAPIRegistry.registerComponent('securitySchemes', 'Cookie', {
		type: 'apiKey',
		in: 'cookie',
		name: 'accessToken',
		description: 'HttpOnly Cookie に設定されたアクセストークン',
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
