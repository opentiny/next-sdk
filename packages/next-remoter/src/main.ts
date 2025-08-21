import { createApp } from 'vue'
import App from './App.vue'
// tiny-robot 对话框
import '@opentiny/tiny-robot/dist/style.css'

import { createRemoter } from './createRemoter'

// 创建浮动块实例
createRemoter({
  qrCodeUrl: 'https://ai.opentiny.design/next-remoter',
  sessionId: '1234567890',
  onShowAIChat: (show) => {
    console.log('show', show)
  }
})

const app = createApp(App)

app.mount('#app')
