<template>
  <div>
    <tiny-robot-chat :prompt-items="promptItems" :suggestion-pill-items="suggestionPillItems"></tiny-robot-chat>
  </div>
</template>

<script setup lang="ts">
import { globalConversation } from './composable/utils'
import { showTinyRobot } from './composable/utils'
import TinyRobotChat from './components/tiny-robot-chat.vue'
import { createRemoter } from '@opentiny/next-sdk'
import { watch, h, PropType } from 'vue'
import { PromptProps, SuggestionPillItem } from '@opentiny/tiny-robot'

const props = defineProps({
  sessionId: {
    type: String,
    default: ''
  },
  promptItems: {
    type: Array as PropType<PromptProps[]>,
    default: () => [
      {
        label: '智能操作网页',
        description: '帮我在商品列表中选中最贵的手机商品',
        icon: h('span', { style: { fontSize: '18px' } }, '🕹')
      }
    ]
  },
  suggestionPillItems: {
    type: Array as PropType<SuggestionPillItem[]>,
    default: () => []
  }
})

watch(
  () => props.sessionId,
  (newVal) => {
    if (newVal) {
      globalConversation.sessionId = newVal
      createRemoter({
        sessionId: props.sessionId,
        onShowAIChat: () => {
          showTinyRobot.value = true
        }
      })
    }
  },
  { immediate: true }
)
</script>
