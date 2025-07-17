# Completions 自动补全

自动补充是针对**动态资源和动态提示词**时，客户端获取他们建议使用哪些自动补全列表，然后客户端再选择一个值，去访问资源和提示词的功能。

## 动态资源

使用 `ResourceTemplate`方式创建资源时，设置 `complete`。

```js{5-8,17}
server.registerResource(
  "repository",
  new ResourceTemplate("github://repos/{category}", {
    list: undefined,
    complete: {
        category: (value: string) =>
            ["books", "movies", "music"].filter((value) =>value.startsWith(test))
    }
  }),
  {
    title: "GitHub Repository",
    description: "Repository information"
  },
  async (uri, { owner, repo }) => ({
    contents: [{
      uri: uri.href,
      text: `Repository: ${category}`
    }]
  })
);
```

客户端查询后， 再次读取资源。

```js{4,3,7,15}
  const result = await client.complete({
        ref: {
            type: "ref/resource",
            uri: "github://repos/{category}",
        },
        argument: {
            name: "category",
            value: "",  // 此处的value 传到 上面的value入参。
        },
    })
    expect(result.completion.values).toEqual(["books", "movies", "music"]);
    expect(result.completion.total).toBe(3);

   const readResult = await client.readResource({
        uri: "github://repos/movies"
    })
```


## 动态提示词 Promt

注册Promt 时，参数必须是 `completable` 类型的schema。

```js{7-9,17}
server.registerPrompt(
  "team-greeting",
  {
    title: "Team Greeting",
    description: "Generate a greeting for team members",
    argsSchema: {
      department: completable(z.string(), (value) => {
        return ["engineering", "sales", "marketing", "support"].filter(d => d.startsWith(value));
      })
    }
  },
  ({ department }) => ({
    messages: [{
      role: "assistant",
      content: {
        type: "text",
        text: `Hello , welcome to the ${department} team!`
      }
    }]
  })
);
```

客户端查询：

```js{4,3,7,8,154}
  const result = await client.complete({
        ref: {
            type: "ref/prompt",
            name: "team-greeting",
        },
        argument: {
            name: "department",
            value: "m", // 此处的value 传到 上面的value入参。
        },
    })
    expect(result.completion.values).toEqual(["marketing"]);
    expect(result.completion.total).toBe(1);

    const prompts = await client.listPrompts();

    const prompt = await client.getPrompt({
        name: "team-greeting",
        arguments: {
            department: "marketing"
        }
    });
```

