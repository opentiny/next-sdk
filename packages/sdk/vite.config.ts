import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import vue from '@vitejs/plugin-vue'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts')
    },
    rollupOptions: {
      external: [/^@modelcontextprotocol\/sdk/, /^@opentiny\/next/, 'openai'],
      input: ['./src/index.ts'],
      output: [
        {
          format: 'es',
          entryFileNames: '[name].mjs',
          preserveModules: true
        }
      ]
    }
  },
  plugins: [vue(), dts()]
})
