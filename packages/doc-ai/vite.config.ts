import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dotenv from 'dotenv'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { TinyVueSingleResolver } from '@opentiny/unplugin-tiny-vue'

// https://vite.dev/config/
export default defineConfig(() => {
  // 加载 .env 文件中的环境变量
  dotenv.config({ path: '.env' })

  return {
    // 注入环境变量到前端代码
    define: {
      'process.env': {
        TINY_USER_TOKEN: process.env.TINY_USER_TOKEN
      }
    },
    plugins: [
      vue(),
      Components({
        resolvers: [TinyVueSingleResolver]
      }),
      AutoImport({
        resolvers: [TinyVueSingleResolver]
      })
    ],
    server: {
      port: 8089,
      host: true
    }
  }
})
