/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
    base: './',
    server: {
        port: 3000,
        open: false,
    },
    test: {
        globals: true,
        environment: 'node',
    },
});