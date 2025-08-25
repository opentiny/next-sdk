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
      :is-remoter="true"
    >
    </tiny-remoter>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { TinyRemoter } from './index'

const show = ref(true)
const fullscreen = ref(true)
const robotRef = ref<InstanceType<typeof TinyRemoter>>()

const query = new URLSearchParams(window.location.search)
const locale = query.get('lang') || 'zh-CN'

const sessionId = query.get('sessionId')!
if (!sessionId) {
  alert('The URL lost sessionId')
}

// 组件内部的已经有默认值。 这里允许通过url 更换agent地址。
const agentRoot = query.get('agentRoot') || 'https://agent.opentiny.design/api/v1/webmcp-trial/'
</script>

<style scoped lang="less">
:deep(.tr-container__header-operations) {
  .tr-icon-button {
    display: none;
  }

  .tr-icon-button:first-child {
    display: block;
  }
}
</style>
