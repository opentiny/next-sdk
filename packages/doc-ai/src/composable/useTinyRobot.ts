import { AIClient, useConversation } from '@opentiny/tiny-robot-kit'
import { IconAi, IconUser } from '@opentiny/tiny-robot-svgs'
import { h, nextTick, onMounted, ref, watch } from 'vue'
import type { SuggestionItem } from '@opentiny/tiny-robot'
import { AgentModelProvider } from './AgentModelProvider'
import { BubbleMarkdownMessageRenderer } from '@opentiny/tiny-robot'
const mdRenderer = new BubbleMarkdownMessageRenderer()

export const useTinyRobot = () => {
  const client = new AIClient({
    providerImplementation: new AgentModelProvider({ provider: 'custom' }),
    provider: 'custom'
  })

  const fullscreen = ref(false)
  const show = ref(true)

  const aiAvatar = h(IconAi, { style: { fontSize: '32px' } })
  const userAvatar = h(IconUser, { style: { fontSize: '32px' } })
  const welcomeIcon = h(IconAi, { style: { fontSize: '48px' } })

  const promptItems = [
    {
      label: '智能操作网页',
      description: '帮我选中最贵的手机商品',
      icon: h('span', { style: { fontSize: '18px' } }, '🕹')
    }
  ]
  const handlePromptItemClick = (ev, item) => {
    sendMessage(item.description)
  }

  const { messageManager } = useConversation({ client })
  const { messageState, inputMessage, sendMessage, abortRequest, messages } = messageManager

  const roles = {
    assistant: {
      type: 'markdown',
      placement: 'start',
      avatar: aiAvatar,
      maxWidth: '80%',
      contentRenderer: mdRenderer
    },
    user: {
      placement: 'end',
      avatar: userAvatar,
      maxWidth: '80%',
      contentRenderer: mdRenderer
    }
  }

  // 建议按钮组，设置对话的模板
  const suggestionPillItems = [
    {
      id: '1',
      text: '帮我选中最贵的手机商品',
      icon: h('span', { style: { fontSize: '18px' } }, '🕹')
    }
  ]

  function handleSuggestionPillItemClick(item: SuggestionItem) {
    if (item.id === '1') {
      let templateText = `请对 [目标组件] ,执行 [操作]`
      let currentInitialValue = { 目标组件: item.text, 操作: '' }

      if (senderRef.value) {
        senderRef.value.setTemplate(templateText, currentInitialValue)
      }
    } else {
      senderRef.value?.setTemplate(item.text, {})
    }
  }

  const senderRef = ref(null)
  const currentTemplate = ref('')
  const suggestionOpen = ref(false)

  // 清除当前指令
  const clearTemplate = () => {
    // 清空指令相关状态
    currentTemplate.value = ''

    // 确保重新聚焦到输入框
    nextTick(() => {
      senderRef.value?.focus()
    })
  }

  // 发送消息
  const handleSendMessage = () => {
    sendMessage(inputMessage.value)

    clearTemplate()
  }

  const handleMessageKeydown = (event, triggerFn, suggestionKeyDown) => {
    // 如果指令面板已打开，交给 suggestion 组件处理键盘事件
    if (suggestionOpen.value) {
      suggestionKeyDown(event)
      return
    }

    // 如果按下斜杠键并且不在指令编辑模式，触发指令面板
    if (event.key === '/' && !currentTemplate.value) {
      triggerFn({
        text: '',
        position: 0
      })
    }

    // ESC 键清除当前指令
    if (event.key === 'Escape' && currentTemplate.value) {
      event.preventDefault()
      clearTemplate()
    }
  }

  watch(
    () => inputMessage.value,
    (value) => {
      // 如果指令面板已打开，并且指令为空，关闭指令面板
      if (suggestionOpen.value && value === '') {
        suggestionOpen.value = false
      }
    }
  )

  // 页面加载完成后自动聚焦输入框
  onMounted(() => {
    setTimeout(() => {
      senderRef.value?.focus()
    }, 500)
  })

  return {
    client,
    fullscreen,
    show,
    aiAvatar,
    userAvatar,
    welcomeIcon,
    promptItems,

    messageManager,
    messages,
    messageState,
    inputMessage,
    sendMessage,
    abortRequest,
    roles,
    handlePromptItemClick,

    senderRef,
    currentTemplate,
    suggestionOpen,
    clearTemplate,
    handleSendMessage,
    handleMessageKeydown,
    suggestionPillItems,
    handleSuggestionPillItemClick
  }
}
