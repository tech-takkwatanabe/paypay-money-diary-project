import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { CreateUserSchema, LoginSchema } from '@paypay-money-diary/shared';
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

const app = new Hono();

app.get('/', (c) => {
	return c.text('Hello Hono!');
});

const api = app.basePath('/api');

// Auth routes
api.post('/auth/signup', zValidator('json', CreateUserSchema), signupHandler);
api.post('/auth/login', zValidator('json', LoginSchema), loginHandler);
api.post('/auth/refresh', refreshHandler);
api.post('/auth/logout', authMiddleware, logoutHandler);
api.get('/auth/me', authMiddleware, meHandler);

// Transaction routes (認証必須)
api.post('/transactions/upload', authMiddleware, uploadCsvHandler);
api.get('/transactions', authMiddleware, getTransactionsHandler);
api.get('/transactions/summary', authMiddleware, getTransactionsSummaryHandler);

// Category routes (認証必須)
api.get('/categories', authMiddleware, getCategoriesHandler);
api.post('/categories', authMiddleware, createCategoryHandler);
api.put('/categories/:id', authMiddleware, updateCategoryHandler);
api.delete('/categories/:id', authMiddleware, deleteCategoryHandler);

const port = process.env.PORT || 8080;

export default {
	port,
	fetch: app.fetch,
	tls: {
		cert: Bun.file('../../.certificate/localhost-cert.pem'),
		key: Bun.file('../../.certificate/localhost-key.pem'),
	},
};
