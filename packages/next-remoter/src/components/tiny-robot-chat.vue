<template>
  <tr-container v-model:show="show" v-model:fullscreen="fullscreen">
    <template #title>
      <h3 class="tr-container__title">{{ title }}</h3>
    </template>
    <tr-bubble-provider :message-renderers="messageRenderers">
      <slot name="welcome" v-if="displayedMessages.length === 0">
        <div style="flex: 1">
          <tr-welcome :title="lang[locale].title" :description="lang[locale].description" :icon="welcomeIcon">
          </tr-welcome>
        </div>
      </slot>
      <tr-bubble-list v-else style="flex: 1" :items="displayedMessages" :roles="roles" auto-scroll> </tr-bubble-list>
    </tr-bubble-provider>

    <template #footer>
      <div class="chat-input">
        <slot name="suggestions"> </slot>
        <tr-sender
          ref="senderRef"
          mode="single"
          v-model="inputMessage"
          :placeholder="
            GeneratingStatus.includes(messageState.status) ? lang[locale].thinking : lang[locale].placeholder
          "
          :clearable="!!inputMessage"
          :loading="GeneratingStatus.includes(messageState.status)"
          :showWordLimit="true"
          :maxLength="1000"
          @submit="handleSendMessage"
          @cancel="abortRequest"
        ></tr-sender>
      </div>
    </template>
  </tr-container>
</template>

<script setup lang="ts">
import {
  TrBubbleList,
  TrContainer,
  TrSender,
  TrWelcome,
  TrBubbleProvider,
  BubbleMarkdownMessageRenderer,
  BubbleChainMessageRenderer
} from '@opentiny/tiny-robot'
import { GeneratingStatus, STATUS } from '@opentiny/tiny-robot-kit'
import { useTinyRobot } from '../composable/useTinyRobot'
import ReactiveMarkdown from './ReactiveMarkdown.vue'
import { computed, nextTick, watch } from 'vue'

defineOptions({
  name: 'TinyRemoter'
})

const props = defineProps({
  /** 必传的会话id */
  sessionId: {
    type: String,
    required: true
  },
  agentRoot: {
    type: String,
    default: 'https://agent.opentiny.design/api/v1/webmcp-trial/'
  },
  /** 左上角的标题 */
  title: {
    type: String,
    default: 'OpenTiny NEXT'
  },
  locale: {
    type: String,
    default: 'zh-CN'
  }
})

const fullscreen = defineModel('fullscreen', { type: Boolean, default: false })
const show = defineModel('show', { type: Boolean, default: false })

const lang: Record<string, { title: string; description: string; placeholder: string; thinking: string }> = {
  'zh-CN': {
    title: '智能助手',
    description: '您好，我是Opentiny Next AI智能助手',
    placeholder: '请输入您的问题',
    thinking: '正在思考中...'
  },
  'en-US': {
    title: 'AI Assistant',
    description: 'Hello, I am OpenTiny Next AI Assistant',
    placeholder: 'Please enter your question',
    thinking: 'Thinking...'
  }
}

const messageRenderers = {
  markdown: ReactiveMarkdown,
  chain: {
    component: BubbleChainMessageRenderer,
    defaultProps: {
      contentRenderer: (content: string) => new BubbleMarkdownMessageRenderer().md.render(content)
    }
  }
}

const {
  welcomeIcon,
  messages,
  messageState,
  inputMessage,
  abortRequest,
  roles,
  senderRef,
  sendMessage,
  handleSendMessage
} = useTinyRobot({
  sessionId: props.sessionId,
  agentRoot: props.agentRoot
})

const displayedMessages = computed(() => {
  if (messageState.status === STATUS.PROCESSING) {
    return [
      ...messages.value,
      {
        role: 'assistant',
        content: lang[props.locale].thinking,
        loading: true
      }
    ]
  }

  return messages.value
})

const scrollToBottom = () => {
  const containerBody = document.querySelector('div.tr-bubble-list')
  if (containerBody) {
    nextTick(() => {
      containerBody.scrollTo({
        top: containerBody.scrollHeight,
        behavior: 'smooth'
      })
    })
  }
}

// 最新消息滚动到底部
watch(() => messages.value[messages.value.length - 1]?.content, scrollToBottom)

defineSlots<{
  welcome(): any
  suggestions(): any
}>()
// 暴露一些重要方法，方便用户写插槽时，可以使用
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
</script>

<style scoped lang="less">
/** 避免输入框没有外边距 */
.chat-input {
  margin-top: 8px;
  padding: 10px 15px;
}

:deep(.tr-welcome__icon) {
  width: 48px;
  height: 48px;
}
</style>
