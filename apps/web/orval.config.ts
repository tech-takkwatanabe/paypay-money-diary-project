import { defineConfig } from 'orval';

export default defineConfig({
	api: {
		input: {
			target: '../api/openapi.yml',
		},
		output: {
			mode: 'tags-split',
			target: './src/api/generated',
			schemas: './src/api/models',
			client: 'fetch',
			clean: true,
			prettier: true,
			baseUrl: '',
			override: {
				mutator: {
					path: './src/api/customFetch.ts',
					name: 'customFetch',
				},
			},
		},
	},
});
