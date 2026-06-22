import { defineConfig } from 'vite';

console.log('Vite config API KEY:', process.env.GEMINI_API_KEY ? 'exists' : 'undefined');

export default defineConfig({});
