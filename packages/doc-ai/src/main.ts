import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import { initI18n, t } from '@opentiny/vue-locale'
import router from './router'
import App from './App.vue'
import { registerMcpConfig } from '@opentiny/vue-common'
// tiny-robot 对话框
import '@opentiny/tiny-robot/dist/style.css'
import './style.css'
import { createMcpTools, getTinyVueMcpConfig, zhCN, enUS } from '@opentiny/tiny-vue-mcp'

const app = createApp(App)

app.use(
  initI18n({
    createI18n,
    i18n: {},
    messages: {
      zhCN,
      enUS
    }
  } as any)
)

// 注册TinyVue组件mcp配置
registerMcpConfig(getTinyVueMcpConfig({ t }), createMcpTools)

app.use(router)
app.mount('#app')
