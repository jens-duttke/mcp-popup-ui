import path from 'node:path';

import { defineConfig } from 'vite';

import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
	root: 'frontend',
	plugins: [react()],
	resolve: {
		alias: {
			'@frontend': path.resolve(__dirname, 'frontend'),
			...(mode === 'development' ? {
				'./App': path.resolve(__dirname, 'frontend/App.development.tsx'),
				'../services/submit': path.resolve(__dirname, 'frontend/services/submit.mock.ts')
			} : {})
		}
	},
	css: {
		modules: {
			localsConvention: 'camelCase'
		}
	},
	build: {
		outDir: '../dist/frontend',
		emptyOutDir: true,
		// Single file output for easy inlining
		cssCodeSplit: false,
		rollupOptions: {
			output: {
				manualChunks: undefined
			}
		}
	}
}));
