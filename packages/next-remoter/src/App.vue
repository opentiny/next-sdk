<template>
  <div>
    <tiny-remoter
      ref="robotRef"
      v-model:show="show"
      v-model:fullscreen="fullscreen"
      title="OpenTiny Next"
      :locale="locale"
      :session-id="sessionId"
      :agentRoot="agentRoot"
    >
      <template #welcome>
        <div style="flex: 1">
          <tr-welcome :title="lang[locale].title" :description="lang[locale].description" :icon="robotRef?.welcomeIcon">
          </tr-welcome>
        </div>
      </template>
      <template #suggestions>
        <tr-prompt-list :items="promptItems" />
      </template>
    </tiny-remoter>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { TrWelcome } from '@opentiny/tiny-robot'
import { TinyRemoter } from './index'

const show = ref(true)
const fullscreen = ref(true)
const robotRef = ref<InstanceType<typeof TinyRemoter>>()

const query = new URLSearchParams(window.location.search)
const locale = query.get('lang') || 'zh-CN'

const lang: Record<string, { title: string; description: string }> = {
  'zh-CN': {
    title: '智能助手',
    description: '您好，我是Opentiny Next AI智能助手'
  },
  'en-US': {
    title: 'AI Assistant',
    description: 'Hello, I am OpenTiny Next AI Assistant'
  }
}

const promptItems = ref([
  {
    label: '智能助手',
    value: '智能助手'
  }
])

const sessionId = query.get('sessionId')!
if (!sessionId) {
  alert('The URL lost sessionId')
}

// 组件内部的已经有默认值。 这里允许通过url 更换agent地址。
const agentRoot = query.get('agentRoot') || 'https://agent.opentiny.design/api/v1/webmcp-trial/'
</script>

<style scoped lang="less">
.next-sdk-ai-panel {
  width: 480px;
  position: fixed;
  top: 0;
  bottom: 0;
  right: 0;
  z-index: 9999;
}

.next-sdk-trigger-btn {
  position: fixed;
  bottom: 136px;
  right: 100px;
  font-size: 24px;
  z-index: 30;
  cursor: pointer;
}

.next-sdk-qr-code-content {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 24px;
}
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

.tr-history-demo {
  position: absolute;
  right: 100%;
  top: 100%;
  z-index: 100;
  width: 300px;
  height: 600px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}

:deep(.tr-container__header-operations button.tr-icon-button:first-child) {
  display: none;
}
</style>
