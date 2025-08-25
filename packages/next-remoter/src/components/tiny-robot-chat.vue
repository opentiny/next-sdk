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
          <tr-prompts
            :items="promptItems"
            :wrap="true"
            item-class="prompt-item"
            class="tiny-prompts"
            @item-click="handlePromptItemClick"
          ></tr-prompts>
        </div>
      </slot>
      <tr-bubble-list v-else style="flex: 1" :items="displayedMessages" :roles="roles" auto-scroll> </tr-bubble-list>
    </tr-bubble-provider>

    <template #footer>
      <div class="chat-input">
        <slot name="suggestions">
          <div class="chat-input-pills">
            <tr-suggestion-pills class="pills" @item-click="handlePillItemClick" :items="pillItems" />
          </div>
        </slot>
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
  TrPrompts,
  TrSuggestionPills,
  BubbleMarkdownMessageRenderer,
  BubbleChainMessageRenderer
} from '@opentiny/tiny-robot'
import { PromptProps, SuggestionPillItem } from '@opentiny/tiny-robot'
import { GeneratingStatus, STATUS } from '@opentiny/tiny-robot-kit'
import { IconEdit } from '@opentiny/tiny-robot-svgs'
import { useTinyRobot } from '../composable/useTinyRobot'
import ReactiveMarkdown from './ReactiveMarkdown.vue'
import { computed, nextTick, watch, h, CSSProperties, markRaw } from 'vue'
import { createRemoter } from '@opentiny/next-sdk'

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

const lang: Record<string, { title: string; description: string; placeholder: string; thinking: string }> = {
  'zh-CN': {
    title: 'OpenTiny NEXT',
    description: '我是你的私人智能助手',
    placeholder: '请输入您的问题',
    thinking: '正在思考中...'
  },
  'en-US': {
    title: 'OpenTiny NEXT',
    description: 'I am your private AI assistant',
    placeholder: 'Please enter your question',
    thinking: 'Thinking...'
  }
}

const handlePromptItemClick = (ev: MouseEvent, item: PromptProps) => {
  sendMessage(item.description)
}

const handlePillItemClick = (item: SuggestionPillItem) => {
  sendMessage(item.text)
}

const promptItems: PromptProps[] = [
  {
    label: props.locale === 'zh-CN' ? '企业办公助手' : 'Enterprise Office Assistant',
    description:
      props.locale === 'zh-CN'
        ? '需要我帮你处理邮件、安排会议、整理文档，还是优化工作流程？'
        : 'Need help with emails, meeting scheduling, document organization, or workflow optimization?',
    icon: h('span', { style: { fontSize: '18px' } as CSSProperties }, '🧠'),
    badge: 'NEW'
  },
  {
    label: props.locale === 'zh-CN' ? '开发技术支持' : 'Development Support',
    description:
      props.locale === 'zh-CN'
        ? '遇到代码问题？需要架构建议？还是想了解最新的技术趋势？'
        : 'Facing code issues? Need architecture advice? Or want to learn about latest tech trends?',
    icon: h('span', { style: { fontSize: '18px' } as CSSProperties }, '💻')
  },
  {
    label: props.locale === 'zh-CN' ? '项目管理协作' : 'Project Management',
    description:
      props.locale === 'zh-CN'
        ? '需要项目规划、任务分配、进度跟踪，还是团队协作建议？'
        : 'Need project planning, task assignment, progress tracking, or team collaboration advice?',
    icon: h('span', { style: { fontSize: '18px' } as CSSProperties }, '📊')
  }
]

const pillItems: SuggestionPillItem[] = [
  {
    id: 'office',
    text: props.locale === 'zh-CN' ? '办公助手' : 'Office Assistant',
    icon: markRaw(IconEdit)
  },
  {
    id: 'development',
    text: props.locale === 'zh-CN' ? '开发支持' : 'Development Support',
    icon: markRaw(IconEdit)
  },
  {
    id: 'management',
    text: props.locale === 'zh-CN' ? '项目管理' : 'Project Management',
    icon: markRaw(IconEdit)
  }
]

const messageRenderers = {
  markdown: ReactiveMarkdown,
  chain: {
    component: BubbleChainMessageRenderer,
    defaultProps: {
      contentRenderer: (content: string) => new BubbleMarkdownMessageRenderer().md.render(content)
    }
  }
}

watch(
  () => props.sessionId,
  (value) => {
    if (value) {
      createRemoter({
        sessionId: value,
        onShowAIChat: () => {
          show.value = true
        }
      })
    }
  },
  {
    immediate: true
  }
)

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

.tr-container {
  container-type: inline-size;

  :deep(.tr-welcome__title-wrapper) {
    display: flex;
    align-items: center;
    justify-content: center;

    .tr-welcome__title {
      font-size: 24px;
      font-weight: 600;
    }
  }
}

.welcome-footer {
  margin-top: 12px;
  color: rgb(128, 128, 128);
  font-size: 12px;
  line-height: 20px;
}

.tiny-prompts {
  padding: 16px 24px;

  :deep(.prompt-item) {
    width: 100%;
    box-sizing: border-box;

    @container (width >=64rem) {
      width: calc(50% - 8px);
    }

    .tr-prompt__content-label {
      font-size: 14px;
      line-height: 24px;
    }
  }
}

:deep(.tr-container__header-operations button.tr-icon-button:first-child) {
  display: none;
}

.chat-input-pills {
  margin-bottom: 8px;
}

:deep(.tr-welcome__icon) {
  width: 48px;
  height: 48px;
}
</style>
