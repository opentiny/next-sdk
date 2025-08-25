<template>
  <div>
    <tiny-remoter
      ref="robotRef"
      v-model:show="show"
      v-model:fullscreen="fullscreen"
      title=""
      :locale="locale"
      :session-id="sessionId"
      :agentRoot="agentRoot"
    >
      <template #welcome>
        <div style="flex: 1">
          <tr-welcome :title="lang[locale].title" :description="lang[locale].description" :icon="robotRef?.welcomeIcon">
          </tr-welcome>
          <tr-prompts
            :items="promptItems"
            :wrap="true"
            item-class="prompt-item"
            class="tiny-prompts"
            @item-click="handlePromptItemClick"
          ></tr-prompts>
        </div>
      </template>
      <template #suggestions>
        <div class="chat-input-pills">
          <tr-suggestion-pill-button>
            <template #icon>
              <IconSparkles style="font-size: 16px; color: #1476ff" />
            </template>
          </tr-suggestion-pill-button>
          <tr-suggestion-pills class="pills" @item-click="handlePillItemClick" :items="pillItems" />
        </div>
      </template>
    </tiny-remoter>
  </div>
</template>

<script setup lang="ts">
import { ref, h, CSSProperties, markRaw } from 'vue'
import { TrWelcome, TrPrompts, TrSuggestionPills } from '@opentiny/tiny-robot'
import { TinyRemoter } from './index'
import { PromptProps, SuggestionPillItem } from '@opentiny/tiny-robot'
import { IconEdit, IconSparkles } from '@opentiny/tiny-robot-svgs'

const show = ref(true)
const fullscreen = ref(true)
const robotRef = ref<InstanceType<typeof TinyRemoter>>()

const query = new URLSearchParams(window.location.search)
const locale = query.get('lang') || 'zh-CN'

const lang: Record<string, { title: string; description: string }> = {
  'zh-CN': {
    title: 'OpenTiny NEXT',
    description: '我是你的私人智能助手'
  },
  'en-US': {
    title: 'OpenTiny NEXT',
    description: 'I am your private AI assistant'
  }
}

const handlePromptItemClick = (ev: MouseEvent, item: PromptProps) => {
  robotRef.value?.sendMessage(item.description)
}

const handlePillItemClick = (item: SuggestionPillItem) => {
  robotRef.value?.sendMessage(item.text)
}

const promptItems: PromptProps[] = [
  {
    label: locale === 'zh-CN' ? '日常助理场景' : 'Daily Assistant',
    description:
      locale === 'zh-CN'
        ? '今天需要我帮你安排日程，规划旅行，还是起草一封邮件？'
        : 'What do you need help with today? Schedule, travel, or draft an email?',
    icon: h('span', { style: { fontSize: '18px' } as CSSProperties }, '🧠'),
    badge: 'NEW'
  },
  {
    label: locale === 'zh-CN' ? '学习/知识型场景' : 'Learning/Knowledge',
    description:
      locale === 'zh-CN'
        ? '有什么想了解的吗？可以是“Vue3 和 React 的区别”！'
        : 'What do you want to know? Can be "The difference between Vue3 and React"?',
    icon: h('span', { style: { fontSize: '18px' } as CSSProperties }, '🤔')
  },
  {
    label: locale === 'zh-CN' ? '创意生成场景' : 'Creative Generation',
    description:
      locale === 'zh-CN'
        ? '想写段文案、起个名字，还是来点灵感？'
        : 'Want to write a copy, come up with a name, or get some inspiration?',
    icon: h('span', { style: { fontSize: '18px' } as CSSProperties }, '✨')
  }
]

const pillItems: SuggestionPillItem[] = [
  {
    id: 'work',
    text: locale === 'zh-CN' ? '工作助手' : 'Work Assistant',
    icon: markRaw(IconEdit)
  },
  {
    id: 'content',
    text: locale === 'zh-CN' ? '内容创作' : 'Content Creation',
    icon: markRaw(IconEdit)
  }
]

const sessionId = query.get('sessionId')!
if (!sessionId) {
  alert('The URL lost sessionId')
}

// 组件内部的已经有默认值。 这里允许通过url 更换agent地址。
const agentRoot = query.get('agentRoot') || 'https://agent.opentiny.design/api/v1/webmcp-trial/'
</script>

<style scoped lang="less">
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
</style>
