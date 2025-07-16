import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/comprehensive' //综合示例
    },
    {
      path: '/comprehensive',
      name: 'Comprehensive',
      component: () => import('../views/comprehensive/index.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('../views/404/NotFound.vue')
    }
  ]
})

export default router
