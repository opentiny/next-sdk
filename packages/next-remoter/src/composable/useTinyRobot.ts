import { AIClient, useConversation } from '@opentiny/tiny-robot-kit'
import { IconAi, IconUser } from '@opentiny/tiny-robot-svgs'
import { h, onMounted, ref } from 'vue'
import { CustomAgentModelProvider } from './AgentModelProvider'
import { BubbleMarkdownMessageRenderer, TrSender } from '@opentiny/tiny-robot'
import logo from '../svgs/logo-next-bg-blue-right.svg'

const mdRenderer = new BubbleMarkdownMessageRenderer()

interface useTinyRobotOption {
  sessionId: string
  agentRoot: string
}

export const useTinyRobot = ({ sessionId, agentRoot }: useTinyRobotOption) => {
  const client = new AIClient({
    providerImplementation: new CustomAgentModelProvider({ provider: 'custom' }, sessionId, agentRoot),
    provider: 'custom'
  })

  const fullscreen = ref(false)
  const show = ref(true)

  const aiAvatar = h(IconAi, { style: { fontSize: '32px' } })
  const userAvatar = h(IconUser, { style: { fontSize: '32px' } })
  const welcomeIcon = h(logo, { style: { width: '48px', height: '48px' } })

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
  const senderRef = ref<InstanceType<typeof TrSender>>()

  // 发送消息
  const handleSendMessage = () => {
    sendMessage(inputMessage.value)
  }

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

    messageManager,
    messages,
    messageState,
    inputMessage,
    sendMessage,
    abortRequest,
    roles,
    senderRef,
    handleSendMessage
  }
}
