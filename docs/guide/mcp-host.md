# 通过各类 MCP Host 操控智能应用

当一个传统的 Web 应用通过 NEXT SDK 升级为智能应用之后，该应用就可以被 AI 操控了。

操控 Web 应用的程序我们称为遥控器，它是一个接入了 AI 的对话框程序，遥控器的载体可以是多种多样的，可以是支持 MCP 的 IDE 软件，比如：VSCode Copilot、Cursor 等，可以是通过智能体平台搭建的智能体应用，比如：Dify、Coze 等，也可以是网页 AI 对话框，比如：Ant Design X、Element Plus X 等，甚至可以是一个手机 App 或 小程序。

## VSCode Copilot

在 VSCode 软件中打开你的项目工程，在项目根目录增加 `.vscode` 文件夹，里面添加一个 `mcp.json` 文件，在该文件中加入以下内容：

```json
{
  "servers": {
    "my-app-mcp-server": {
      "url": "https://ai.opentiny.design.mcp?sessionId=stream06-1921-4f09-af63-51de410e9e09"
    }
  }
}
```

配置完成之后点击 `my-app-mcp-server` 上方的启动按钮，这时你的 Web 应用的 MCP Server 就启动了。

然后打开 VSCode Copilot AI 对话框，切换到 Agent 模式，在输入框中输入“帮我选中员工数最多的公司”，这时 AI 就会调用你的 Web 应用中定义的 MCP 工具，操作你的 Web 应用，选中公司列表中员工数最多的公司。

待截图

## Cursor

## Dify
