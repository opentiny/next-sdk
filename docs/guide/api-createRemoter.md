# createRemoter 函数

```typescript
import { createRemoter } from '@opentiny/next-sdk'
```

`createRemoter` 函数用于创建一个智能遥控器浮动块组件，它提供了一个悬浮在页面右下角的交互式浮动按钮，包含二维码生成、AI对话和遥控指令等功能。

## 功能特性

- **浮动按钮**: 固定在页面右下角的圆形浮动按钮
- **下拉菜单**: 点击浮动按钮展开功能菜单
- **二维码生成**: 生成包含会话ID的二维码，支持移动端扫码
- **AI对话**: 可自定义AI对话功能回调
- **遥控指令**: 提供遥控指令输入界面

## 基本使用

```typescript
import { createRemoter } from '@opentiny/next-sdk'

// 创建遥控器实例
const remoter = createRemoter({
  qrCodeUrl: 'https://your-app.com/remote-control',
  sessionId: 'your-session-id',
  onShowAIChat: () => {
    // 显示AI对话界面
    showAIChatDialog()
  }
})
```

## 功能说明

### 下拉菜单

点击浮动按钮后展开的功能菜单包含三个选项：

1. **弹出二维码** (`qr-code`)
   - 生成包含会话ID的二维码
   - 支持自定义二维码URL
   - 弹窗显示二维码图片

2. **弹出AI对话框** (`ai-chat`)
   - 调用 `onShowAIChat` 回调函数
   - 可自定义AI对话实现逻辑

3. **发送遥控指令** (`remote-control`)
   - 显示遥控指令输入界面
   - 包含用户名输入框和发送按钮

通过 `createRemoter` 函数，你可以轻松为你的应用添加一个功能完整的智能遥控器浮动组件，提升用户体验和交互便利性。

## Vue 技术栈扩展

通过基于 `createRemoter` 的扩展包 `@opentiny/next-remoter` ，可以轻松在 Vue 技术栈中使用。

```vue
<template>
  <div>
    <tiny-remoter :session-id="sessionId" :prompt-items="promptItems" :suggestion-pill-items="suggestionPillItems" />
  </div>
</template>

<script setup lang="ts">
import { TinyRemoter } from '@opentiny/next-remoter'
import { ref, h } from 'vue'

const sessionId = ref('your-session-id')

// 自定义快捷提示词
const promptItems = ref([
  {
    label: '智能操作网页',
    description: '帮我选中最贵的手机商品',
    icon: h('span', { style: { fontSize: '18px' } }, '🕹')
  }
])

// 自定义建议选项
const suggestionPillItems = ref([
  {
    label: '智能操作网页',
    description: '在商品列表中',
    icon: h('span', { style: { fontSize: '18px' } }, '🕹')
  }
])
</script>
```
