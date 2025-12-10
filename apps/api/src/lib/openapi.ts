/**
 * OpenAPI アプリケーション設定
 * 開発環境のみ Swagger UI を提供
 */

import { OpenAPIHono } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';

// OpenAPIHono インスタンスを作成
export const createOpenAPIApp = () => {
	const app = new OpenAPIHono();

	// 開発環境のみ OpenAPI ドキュメントと Swagger UI を提供
	if (process.env.NODE_ENV !== 'production') {
		// OpenAPI JSON エンドポイント
		app.doc('/openapi.json', {
			openapi: '3.1.0',
			info: {
				title: 'PayPay Money Diary API',
				version: '1.0.0',
				description: 'PayPay 家計簿アプリケーション API',
			},
			servers: [
				{
					url: 'https://localhost:8080',
					description: 'Development server',
				},
			],
		});

		// Swagger UI
		app.get('/docs', swaggerUI({ url: '/api/openapi.json' }));
	}

	return app;
};

export type AppType = ReturnType<typeof createOpenAPIApp>;
