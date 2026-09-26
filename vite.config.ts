import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      tailwindcss(),
      react()
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || ''),
      'process.env.GROQ_API_KEY': JSON.stringify(env.GROQ_API_KEY || env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY || ''),
      'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL || env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''),
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
    server: {
      port: 3000,
    }
  };
});
