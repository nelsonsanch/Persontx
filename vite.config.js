import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import envCompatible from 'vite-plugin-env-compatible';
import path from 'path';

export default defineConfig({
    plugins: [
        react(),
        envCompatible({ prefix: 'REACT_APP_' })
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 3000,
        proxy: {
            '/.netlify/functions': {
                target: 'http://localhost:8888',
                changeOrigin: true,
                secure: false,
            },
        },
    },
    build: {
        outDir: 'build',
    },
    esbuild: {
        loader: 'jsx',
        include: /src\/.*\.[jt]sx?$/,
        exclude: [],
    },
    optimizeDeps: {
        esbuildOptions: {
            loader: {
                '.js': 'jsx',
            },
        },
    },
});
