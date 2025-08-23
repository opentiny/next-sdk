# TinyRemoter ---- tiny-robot 版本

```javascript
import { TinyRemoter } from '@opentiny/next-remoter'
```

该组件为使用 `@opentiny/tiny-robot` 开发的 `TinyRemoter`, 仅支持 `Vue3`。

## 属性

- v-model:fullscreen 双向绑定是否全屏
- v-model:show 双向绑定是否显示，内部关闭是emit('update:show',false)
- sessionId 必须传
- title 左上角的 container.title
- agentRoot 后端代理的地址，有默认值 `https://agent.opentiny.design/api/v1/webmcp-trial/`

## 插槽

- #welcome: 没有对话消息时，展示在组件中间的`Welcome & Promts` 等内容。设计成插槽可以让用户有完全的定制能力。
- #suggestions: 展示在输入框上面的提示性组件。可以使用 `@opentiny/tiny-robot` 中的 `SuggestionPills`等强大功能的组件。

## 导出变量

```typescript
defineExpose({
  /** 欢迎图标 */
  welcomeIcon,
  /** 对话消息 */
  messages,
  /** 对话消息状态 */
  messageState,
  /** 对话卡片的角色配置 */
  roles,
  /** 输入框的文本 */
  inputMessage,
  /** 输入框组件的实例 */
  senderRef,
  /** 取消发送 */
  abortRequest,
  /** 发送消息 */
  sendMessage
})
```

导出变量是方便在插槽中使用内部的功能，比如 `#welcome插槽` 中点击后 `Promts`,发出固定的请求:

```typescript
const robotRef = ref<InstanceType<typeof TinyRemoter>>()

function promtClick(item) {
  robotRef.sendMessage(item.description)
}
```

## 综合示例

请参考 `next-remoter/App.vue` 文件。
