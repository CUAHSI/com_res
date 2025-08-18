import { fileURLToPath, URL } from 'url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import crypto from 'crypto'
import vueDevTools from 'vite-plugin-vue-devtools'


// Polyfill for Node 18+
if (!crypto.hash) {
  crypto.hash = crypto.createHash
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  return {
    plugins: [vue(), vuetify(), vueDevTools()],
    root: './',
    // for GH pages deployment, set VITE_APP_BASE=/com_res/ in .env
    base: env.VITE_APP_BASE || '/',
    envDir: '../',
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      port: 5173
    }
  }
})
