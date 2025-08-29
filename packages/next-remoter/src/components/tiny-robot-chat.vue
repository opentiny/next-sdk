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
          mode="multiple"
          v-model="inputMessage"
          :placeholder="senderPlaceholder"
          :clearable="!!inputMessage"
          :loading="senderLoading"
          :showWordLimit="true"
          :maxLength="1000"
          @submit="handleSendMessage"
          @cancel="abortRequest"
        >
          <template #footer-left>
            <div class="sender-left-icon">
              <!-- 插件开关 -->
              <IconPlugin @click="pluginVisible = !pluginVisible"></IconPlugin>
            </div>
          </template>
        </tr-sender>

        <!-- 插件面板 -->
        <TrMcpServerPicker
          v-model:visible="pluginVisible"
          :popup-config="{ type: 'drawer' }"
          :show-custom-add-button="false"
          :installedPlugins="installedPlugins"
          :marketPlugins="marketPlugins"
          :market-category-options="marketCategoryOptions"
          :installed-search-fn="handleMcpServerPickerSearchFn"
          :market-search-fn="handleMcpServerPickerSearchFn"
          @plugin-toggle="handlePluginToggle"
          @plugin-add="handlePluginAdd"
          @plugin-delete="handlePluginDelete"
          @tool-toggle="handleToolToggle"
        >
        </TrMcpServerPicker>
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
  BubbleMarkdownContentRenderer,
  TrMcpServerPicker,
  PluginInfo,
  MarketCategoryOption,
  PluginTool
} from '@opentiny/tiny-robot'
import { PromptProps } from '@opentiny/tiny-robot'
import { GeneratingStatus, STATUS } from '@opentiny/tiny-robot-kit'
import { IconNewSession, IconPlugin } from '@opentiny/tiny-robot-svgs'
import { useTinyRobot } from '../composable/useTinyRobot'
import { nextTick, watch, h, CSSProperties, toRef, computed, ref } from 'vue'
import { createRemoter } from '@opentiny/next-sdk'
import QrCodeScan from './qr-code-scan.vue'
import { DEFAULT_SERVERS } from './default-mcps'

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
  agent, // ai-sdk的自定义代理，client通过它和llm 对话。 agent.ignoreToolnames=[] 是记录需要过滤掉的tools
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

// 自动计算的变量
const senderPlaceholder = computed(() =>
  GeneratingStatus.includes(messageState.status) ? lang[props.locale].thinking : lang[props.locale].placeholder
)

const senderLoading = computed(() => GeneratingStatus.includes(messageState.status))

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

// 处理扫码结果。 把结果添加到 agent.mcpServers， 以及 插入McpServerPicker的一个Plugin
const handleScanSuccess = async (decodedText: string) => {
  const url = new URL(decodedText)
  const sessionId = url.searchParams.get('sessionId')

  if (sessionId) {
    const mcpConfig = {
      type: 'streamableHttp',
      url: `${props.agentRoot}mcp?sessionId=${sessionId}`
    } as const
    // 1、 插入McpServers, 此时内部会判断重复。  不重复则 initClients()
    const inserted = await agent.insertMcpServer(mcpConfig)

    if (inserted) {
      // 2、 插入Plugin
      const lastClient = agent.mcpClients.slice(-1)[0] //
      const clientTools = (await lastClient.tools()) || {}

      const plugin: PluginInfo = {
        id: `plugin-${sessionId}`,
        name: url.origin,
        icon: 'https://res.hc-cdn.com/tinyui-design/3.25.0.20250721191929/home/favicon.ico',
        description: sessionId,
        enabled: true,
        expanded: true,
        tools: Object.keys(clientTools).map((key) => {
          return {
            id: key,
            name: key,
            description: clientTools[key].description as string,
            enabled: true
          }
        }),
        // @ts-ignore
        originMcpConfig: mcpConfig // 缓存对应的mcpServers中的一个值
      }

      installedPlugins.value.push(plugin)
    }
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

// 对接 mcp server picker 组件
const pluginVisible = ref(false)

// 已安装插件数据
const installedPlugins = ref<PluginInfo[]>([])

// 市场插件数据
const marketPlugins = ref<PluginInfo[]>([...DEFAULT_SERVERS])

// 市场分类选项
const marketCategoryOptions = ref<MarketCategoryOption[]>([
  { value: '', label: '全部分类' },
  { value: 'productivity', label: '生产力工具' },
  { value: 'communication', label: '沟通协作' },
  { value: 'development', label: '开发工具' },
  { value: 'ai', label: 'AI 助手' }
])

// 整个插件的打开或关闭
const handlePluginToggle = (plugin: PluginInfo, enabled: boolean) => {
  // Keep empty!
}

// 某个tool的打开或关闭。  全部tool状态一致时，会同时触发handlePluginToggle 一下。
const handleToolToggle = (plugin: PluginInfo, toolId: string, enabled: boolean) => {
  if (enabled) {
    agent.ignoreToolnames = agent.ignoreToolnames.filter((name) => name !== toolId)
  } else {
    agent.ignoreToolnames.push(toolId)
  }
}
// 插件删除
const handlePluginDelete = (plugin: PluginInfo) => {
  // 从安装插件删除， 市场插件还原状态。
  installedPlugins.value = installedPlugins.value.filter((item) => item !== plugin)
  const findInMarket = marketPlugins.value.find((item) => item.id === plugin.id)
  if (findInMarket) {
    findInMarket.added = false
  }

  // 移除mcpServers
  agent.mcpServers = agent.mcpClients.filter((item) => item !== plugin.originMcpConfig)
  // 移除 ignoreToolnames
  plugin.tools.forEach((tool) => {
    agent.ignoreToolnames = agent.ignoreToolnames.filter((name) => name !== tool.name)
  })
}
// 插件添加。 新添加的插件默认不启用，所以不需要更新 tools
const handlePluginAdd = (plugin: PluginInfo) => {
  plugin.added = true

  installedPlugins.value.push({
    ...plugin,
    id: plugin.id,
    enabled: false, // 新添加的插件默认不启用
    added: true
  })
}

// 搜索已安装或者搜索市场，两个函数一样的。
const handleMcpServerPickerSearchFn = (query: string, item: PluginInfo) => {
  return query.trim() === '' || item.name.toLowerCase().includes(query.toLowerCase())
}

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

.sender-left-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  padding: 0 6px;
  border-radius: 6px;
  cursor: pointer;
  & svg {
    font-size: 20px;
  }

  &:hover {
    background-color: #f5f5f5;
    svg {
      color: #1476ff;
    }
  }
}

:deep(.tr-icon-button) {
  display: flex;
  align-items: center;
}
</style>
