<template>
  <tr-container v-model:show="show" v-model:fullscreen="fullscreen">
    <template #title>
      <h3 class="tr-container__title">{{ title }}</h3>
    </template>
    <template #operations>
      <tr-icon-button :icon="IconNewSession" size="28" svgSize="20" @click="createConversation()" />
      <QrCodeScan @scanSuccess="handleScanSuccess" />
    </template>
    <tr-bubble-provider :content-renderers="contentRenderer">
      <slot name="welcome" v-if="messages.length === 0">
        <div style="flex: 1">
          <tr-welcome :title="lang[locale].title" :description="lang[locale].description" :icon="welcomeIcon">
          </tr-welcome>
          <tr-prompts :items="promptItems" :wrap="true" class="tiny-prompts" item-class="prompt-item"></tr-prompts>
        </div>
      </slot>
      <tr-bubble-list
        v-else
        style="flex: 1"
        :items="messages"
        :roles="roles"
        auto-scroll
        :loading="messageState.status === STATUS.PROCESSING"
        loading-role="assistant"
      >
      </tr-bubble-list>
    </tr-bubble-provider>

    <template #footer>
      <div class="chat-input">
        <slot name="suggestions">
          <div class="chat-input-pills">
            <tr-dropdown-menu
              v-for="pill in pillItems"
              :key="pill.id"
              :items="pill.menus"
              @item-click="handlePillItemClick"
              trigger="click"
            >
              <template #trigger>
                <TrSuggestionPillButton>{{ pill.text }}</TrSuggestionPillButton>
              </template>
            </tr-dropdown-menu>
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
  TrDropdownMenu,
  TrSuggestionPillButton,
  TrIconButton,
  BubbleMarkdownContentRenderer
} from '@opentiny/tiny-robot'
import { PromptProps } from '@opentiny/tiny-robot'
import { GeneratingStatus, STATUS } from '@opentiny/tiny-robot-kit'
import { IconNewSession } from '@opentiny/tiny-robot-svgs'
import { useTinyRobot } from '../composable/useTinyRobot'
import { nextTick, watch, h, CSSProperties, toRef } from 'vue'
import { createRemoter } from '@opentiny/next-sdk'
import QrCodeScan from './qr-code-scan.vue'

defineOptions({
  name: 'TinyRemoter'
})

const props = defineProps({
  /** 必传的会话id */
  sessionId: {
    type: String,
    default: ''
  },
  /** 后端的代理服务器地址 */
  agentRoot: {
    type: String,
    default: 'https://agent.opentiny.design/api/v1/webmcp-trial/'
  },
  /** 左上角的标题 */
  title: {
    type: String,
    default: 'OpenTiny Next'
  },
  /** 语言 en-US、zh-CN */
  locale: {
    type: String,
    default: 'zh-CN'
  },
  /** 展示模式： 'remoter' | 'chat-dialog'
   * 遥控器模式： 自动在右下角显示一个AI图标，且有3个菜单项。
   * 对话框模式： 直接显示一个对话框界面
   *  */
  mode: {
    type: String,
    default: 'remoter'
  }
})

const fullscreen = defineModel('fullscreen', { type: Boolean, default: false })
const show = defineModel('show', { type: Boolean, default: false })

const {
  client,
  welcomeIcon,
  messages,
  messageState,
  inputMessage,
  abortRequest,
  roles,
  senderRef,
  sendMessage,
  handleSendMessage,
  createConversation
} = useTinyRobot({
  sessionId: toRef(props, 'sessionId'),
  agentRoot: toRef(props, 'agentRoot')
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

// 默认的Prompts。 仅做为介绍性文字，点击不触发事件
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

// 默认的 SuggestionPills
const mapMake = (str: string, id: number) => {
  const [text, inputMessage] = str.split('#')
  return { id, text, inputMessage }
}
const pillItems = [
  {
    id: 'office',
    text: props.locale === 'zh-CN' ? '办公助手' : 'Office Assistant',
    menus: [
      '接收邮件#请同步邮箱的新邮件。',
      '编写邮件#请新建一个邮件，收件人为 opentiny-next@meeting.com, 内容为举办一个临时会议。',
      '安排会议#创建一个临时的在线会议，主题为讨论问题，时长为1小时。',
      '整理文档#请分析附件中的销售情况，把销售额绘制成折线图。'
    ].map(mapMake)
  },
  {
    id: 'development',
    text: props.locale === 'zh-CN' ? '开发支持' : 'Development Support',
    menus: [
      '遇到代码问题#请检查当前位置的报错原因。',
      '架构建议#请使用NodeJs实现一个分块上传文件的模块。',
      '最新的技术趋势#请分析Vue与React 框架的优劣分别是什么？'
    ].map(mapMake)
  },
  {
    id: 'management',
    text: props.locale === 'zh-CN' ? '项目管理' : 'Project Management',
    menus: [
      '项目规划#如何开展品牌推广的活动？',
      '任务分配#将本季度的销售任务分配给三个人，并生成甘特图进行跟踪。',
      '进度跟踪#分析团队的任务完成情况。'
    ].map(mapMake)
  }
]
const handlePillItemClick = (item: ReturnType<typeof mapMake>) => {
  inputMessage.value = item.inputMessage
}

const handleScanSuccess = (decodedText: string) => {
  const url = new URL(decodedText)
  const agent = client?.provider?.agent
  const sessionId = url.searchParams.get('sessionId')

  if (sessionId && agent) {
    agent.insertMcpServers([
      {
        type: 'streamableHttp',
        url: `${props.agentRoot}mcp?sessionId=${sessionId}`
      }
    ])
  }
}

// 自定义消息渲染器
const contentRenderer = { markdown: new BubbleMarkdownContentRenderer() }

// 如果是遥控器模式，则初始化右下角的AI 图标
if (props.mode === 'remoter') {
  createRemoter({
    sessionId: props.sessionId,
    menuItems: [
      {
        action: 'remote-control',
        show: false // 隐藏发送用户名选项
      }
    ],
    onShowAIChat: () => {
      show.value = true
    }
  })
}

// 最新消息滚动到底部
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
watch(() => messages.value[messages.value.length - 1]?.content, scrollToBottom)

// 定义插槽
defineSlots<{
  welcome(): any
  suggestions(): any
}>()

// 定义输出：  暴露一些重要方法，方便用户写插槽时，可以使用。
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

.chat-input-pills {
  margin-bottom: 8px;
  display: flex;
  gap: 16px;
}

:deep(.tr-welcome__icon) {
  width: 48px;
  height: 48px;
}
</style>
