<template>
  <div class="not-found">
    <div class="content">
      <h1>404</h1>
      <p>页面建设中...</p>
      <div class="construction">🚧</div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 404页面组件
</script>

<style scoped>
.not-found {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
}

.content {
  text-align: center;
}

h1 {
  font-size: 4rem;
  color: #333;
  margin-bottom: 1rem;
}

p {
  font-size: 1.5rem;
  color: #666;
  margin-bottom: 2rem;
}

.construction {
  font-size: 3rem;
}
</style>
