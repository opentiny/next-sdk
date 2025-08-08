import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import vue from '@vitejs/plugin-vue'

const __dirname = dirname(fileURLToPath(import.meta.url))

// 主配置 - 只构建chat模块UMD格式
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/chat/index.ts'),
      name: 'TinyRemoter',
      formats: ['umd'],
      fileName: 'index'
    },
    rollupOptions: {
      external: [/^@modelcontextprotocol\/sdk/, /^@opentiny\/next/, 'openai', 'vue'],
      output: {
        dir: 'dist/chat',
        globals: {
          'vue': 'Vue'
        },
        exports: 'named'
      }
    }
  },
  plugins: [vue()],
  define: {
    'process.env': { TINY_MODE: 'pc' }
  }
})
