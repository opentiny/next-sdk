# 通过各类 MCP Host 操控智能应用

当一个传统的 Web 应用通过 NEXT SDK 升级为智能应用之后，该应用就可以被 AI 操控了。

操控 Web 应用的程序我们称为遥控器，它是一个接入了 AI 的对话框程序，遥控器的载体可以是多种多样的，可以是支持 MCP 的 IDE 软件，比如：VSCode Copilot、Cursor 等，可以是通过智能体平台搭建的智能体应用，比如：Dify、Coze 等，也可以是网页 AI 对话框，比如：Ant Design X、Element Plus X 等，甚至可以是一个手机 App 或 小程序。

## VSCode Copilot

a. 在 VSCode 软件中打开你的项目工程，在项目根目录增加 `.vscode` 文件夹，里面添加一个 `mcp.json` 文件，在该文件中加入以下内容：

```json
{
  "servers": {
    "my-app-mcp-server": {
      "url": "https://ai.opentiny.design/mcp?sessionId=stream06-1921-4f09-af63-51de410e9e09"
    }
  }
}
```

b. 配置完成之后点击 `my-app-mcp-server` 上方的启动按钮，这时你的 Web 应用的 MCP Server 就启动了。

![](../assets/images/vscode-copilot/1.png)

c. 然后使用快捷键 Ctrl + Alt + I 打开 VSCode Copilot AI 对话框，切换到 Agent 模式。

![](../assets/images/vscode-copilot/2.png)

d. 在输入框中输入需要操作的内容，这时 AI 就会调用你的 Web 应用中定义的 MCP 工具，操作你的 Web 应用，例如帮我选中ID为6的公司,就会调用定义的mcp工具，点击继续按钮

![](../assets/images/vscode-copilot/4.png)

e. 查看是否调用 MCP 工具成功

![](../assets/images/vscode-copilot/3.png)

## Cursor

a. 在 https://cursor.com/cn 官网下载Cursor软件

![](../assets/images/cursor/1.png)

b. 在Cursor中配置mcp servers ctrl + L 弹出AI对话框，点击设置按钮进行设置 MCP Server 

![](../assets/images/cursor/2.png)

c. 按照下面的步骤手动进行手动添加

```json
{
  "servers": {
    "my-app-mcp-server": {
      "url": "https://ai.opentiny.design/mcp?sessionId=stream06-1921-4f09-af63-51de410e9e09"
    }
  }
}
```

d. 查看mcp是否配置成功并且进行验证

![](../assets/images/cursor/4.png)

e. 新建会话，切换到 Agent 模式，在输入框中输入需要操作的内容，这时 AI 就会调用你的 Web 应用中定义的 MCP 工具，操作你的 Web 应用

![](../assets/images/cursor/5.png)

## Windsurf

a. 在 https://windsurf.com/ 官网下载 Windsurf 软件

![](../assets/images/windsurf/1.png)

b. 在 Windsurf 中配置 mcp servers ，先找到windsurf对话框上方的锤子按钮 

![](../assets/images/windsurf/2.png)

c. 配置mcp_config.json*文件，格式如图

![](../assets/images/windsurf/3.png)

d. 点击Refresh会出现我们的mcp servers

![](../assets/images/windsurf/4.png)


e. 新建会话，切换到 Agent 模式，在输入框中输入需要操作的内容，这时 AI 就会调用你的 Web 应用中定义的 MCP 工具，操作你的 Web 应用

![](../assets/images/windsurf/5.png)

## Trae

下载软件

![](../assets/images/trae/1.png)

在Trae中配置mcp servers

ctrl + u 弹出AI对话框，找到AI功能管理中的AI功能管理按钮

![](../assets/images/trae/2.png)

继续按照下面的步骤手动添加 mcp servers

![](../assets/images/trae/3.png)

手动配置格式如图

![](../assets/images/trae/4.png)

查看mcp是否配置成功并且进行验证

![](../assets/images/trae/5.png)

新建会话，选择mcp智能体

![](../assets/images/trae/6.png)

![](../assets/images/trae/7.png)

![](../assets/images/trae/8.png)

验证成功

![](../assets/images/trae/9.png)

## Cherry Studio

下载软件

![](../assets/images/cherry-studio/1.png)

选择助手

![](../assets/images/cherry-studio/2.png)

![](../assets/images/cherry-studio/3.png)

在 Cherry Studio配置mcp servers

配置mcp，格式如图

![](../assets/images/cherry-studio/4.png)

![](../assets/images/cherry-studio/5.png)

![](../assets/images/cherry-studio/6.png)

![](../assets/images/cherry-studio/7.png)

配置模型

![](../assets/images/cherry-studio/8.png)

注册登录账号，选择一个适合自己的模型，成功后如下图

![](../assets/images/cherry-studio/9.png)

在对话框中进行验证

![](../assets/images/cherry-studio/10.png)

![](../assets/images/cherry-studio/11.png)

## Cline

vscode下载Cline 插件

![](../assets/images/cline/1.png)

用github账号进行登录

在cline中配置mcp servers

![](../assets/images/cline/2.png)

会自动生成下面的文件

![](../assets/images/cline/3.png)

![](../assets/images/cline/4.png)

智能体选中agent然后进行验证

![](../assets/images/cline/5.png)

![](../assets/images/cline/6.png)

验证成功

![](../assets/images/cline/7.png)

## 通义灵码

下载 IDE 软件

![](../assets/images/lingma/1.png)

![](../assets/images/lingma/2.png)

![](../assets/images/lingma/3.png)

在通义灵码中配置mcp servers

Ctrl + Shift + L 弹出AI对话框，找到AI功能管理中的AI功能管理按钮

![](../assets/images/lingma/4.png)

继续按照下面的步骤手动添加 mcp servers

![](../assets/images/lingma/5.png)

手动配置格式如图

![](../assets/images/lingma/6.png)

查看mcp是否配置成功并且进行验证

![](../assets/images/lingma/7.png)

新建会话，选择智能体

![](../assets/images/lingma/8.png)

验证成功

![](../assets/images/lingma/9.png)

## Dify

进入dify官网，登录后点击打开网页版并进行登录注册

![](../assets/images/dify/1.png)

![](../assets/images/dify/2.png)

在 Dify 中配置mcp servers

创建Chatflow空白应用

![](../assets/images/dify/3.png)

![](../assets/images/dify/4.png)

新建agent智能体

![](../assets/images/dify/5.png)

设置 AGENT 策略

![](../assets/images/dify/6.png)

![](../assets/images/dify/7.png)

![](../assets/images/dify/8.png)

设置模型

![](../assets/images/dify/9.png)

![](../assets/images/dify/10.png)

![](../assets/images/dify/11.png)

![](../assets/images/dify/12.png)

MCP 服务配置

![](../assets/images/dify/13.png)

查看运行是否成功

![](../assets/images/dify/14.png)

进行发布

![](../assets/images/dify/15.png)

![](../assets/images/dify/16.png)

运行这个编排任务

![](../assets/images/dify/17.png)

验证这个任务

![](../assets/images/dify/18.png)

验证成功

![](../assets/images/dify/19.png)

![](../assets/images/dify/20.png)

## Coze

进入 coze 官网，登录后点击打开网页版

![](../assets/images/coze/1.png)

在 coze 中配置mcp servers

添加管理工具

![](../assets/images/coze/2.png)

添加自定义管理工具

![](../assets/images/coze/3.png)

![](../assets/images/coze/4.png)

查看是否添加成功（如下图）

![](../assets/images/coze/5.png)

进行验证

![](../assets/images/coze/6.png)

![](../assets/images/coze/7.png)

![](../assets/images/coze/8.png)

![](../assets/images/coze/9.png)
