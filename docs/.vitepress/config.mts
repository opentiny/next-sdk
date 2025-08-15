import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "OpenTiny NEXT SDK",
  description: "OpenTiny NEXT SDK",
  base: '/next-sdk/',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '指引', link: '/guide/', activeMatch: '/guide/' },
    ],

    sidebar: {
      '/guide/': [
          {
            text: '介绍',
            items: [
              { text: '开始', link: '/guide/' },
              { text: '为什么选 NEXT SDK', link: '/guide/why' }
          ]
        },
        {
          text: '指引',
          items: [
            { text: '远程连接 WebAgent 服务器', link: '/guide/connect-web-agent' },
            { text: '通过 MCP Host 操控 Web 应用', link: '/guide/mcp-host' },
            { text: 'Electron 应用接入', link: '/guide/electron' },
            { text: 'uni-app 应用接入', link: '/guide/uni-app' },
            { text: '本地连接', link: '/guide/connect-local' },
            { text: '常见问题', link: '/guide/faq' }
          ]
        },
        {
          text: 'API',
          items: [
            { text: 'WebMcpClient 类', link: '/guide/api-client' },
            { text: 'WebMcpServer 类', link: '/guide/api-server' },
            { text: '工具函数', link: '/guide/api-tools' },
          ]
        }
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/opentiny/next-sdk' }
    ]
  }
})
