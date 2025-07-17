import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Next SDK WIKI",
  description: "Next SDK 文集",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: '介绍', link: '/introduce' }
    ],

    sidebar: [
      {
        text: '目录',
        items: [
          { text: '介绍', link: '/introduce' },
          { text: '自动补充', link: '/complete' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/opentiny/next-sdk' }
    ]
  }
})
