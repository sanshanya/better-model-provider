# better-model-provider

为 DeepSeek Harness（dsh）提供了更好的自定义供应商模型接入，支持**原生**视觉输入、按模型声明推理强度，以及按模型设置 token 容量（上下文窗口 / 最大输出）。

[English](README.md) | 中文

![用插件编辑一个模型行的界面](docs/screenshot.png)

## **为什么需要它**

官方的「模型」设置页能管理提供方和模型行，但两个按模型的能力字段一直只能手写 YAML：`reasoningEfforts`（模型接受哪些推理档位、每档发往端点的拼写）和 `input`（模型接受哪些请求模态）。本页编辑这两项，**外加**按模型的 token 容量（`contextWindow` / `maxTokens`）——作用在你声明的模型上——一个模型在一行里配完。能力字段不声明的话：

- 会话输入框的模型选择器不会为你的模型显示推理强度控件；
- 含图片的会话切换模型时会被拦下（`Model ... does not accept image input`），因为手工声明的模型默认纯文本。

## **安装**

```
# 从 GitHub：
dsh plugin --profile web add github:sanshanya/better-model-provider

# 本地联调（先构建——link: 规格按原样挂载）：
npm install && npm run build
dsh plugin --profile web add link:<本仓库绝对路径>
```

GitHub 安装有一个**构建脚本门槛**：`github:` 规格只拉取源码——`lib/` 由本包的 `prepare` 构建——而 dsh 组包所用的 pnpm 默认不执行 git 依赖的构建脚本。安装器会打印需要放行的确切 key，把它加进该 profile 的 `pnpm-workspace.yaml` 的 `allowBuilds` 下，然后重跑 `add` 命令。

重启 `dsh web`，硬刷浏览器，设置侧边栏会出现「模型能力」。卸载：

```
dsh plugin --profile web rm better-model-provider
```

## **使用**

1. 先在官方「模型」页把提供方配好（API 密钥在那边管理，本页不碰凭据）。
2. 打开 **设置 → 模型能力**。
3. 展开模型行：推理强度选「自定义」并勾选档位；视觉模型把输入模态的 `image` 勾上；提供方默认值不对时直接填上下文窗口 / 最大输出 token（支持 `380K`、`1M` 写法）。提供方和模型的生命周期仍由官方「模型」页负责。
4. 应用。选择器立即只提供所声明的档位，宿主机图像准入同步放行。

小提示：只勾 `{ high }` 选择器就只有 High；再补勾 `off`（取值为空 → `null`）才有 Off 可选。

## **开发**

```
npm install
npm run build            # lib/index.js + lib/client.js（模块加载器形态 bundle）
npm test                 # 单元 + 交互流 + bundle 冒烟
npm run test:coverage    # v8 每文件 100% 行/函数/语句，95% 分支
npm run lint; npm run typecheck
npm run verify:pack      # npm pack + 装进空项目消费者 + tsc 探针

# 真实 Harness 门禁（需要本地 DeepSeek Harness 仓库）：
BMP_DSH_DIR=/path/to/deepseek-harness npm run test:live          # 集成
BMP_DSH_DIR=/path/to/deepseek-harness \
BMP_CHROME_PATH="/path/to/chromium" \
  npm run test:functional    # 真实浏览器驱动一次真实写入 settings.yaml
```

CI 在每次推送跑封闭门禁（`ci` workflow），每晚 + 手动触发跑两条真实 harness 车道（`live` workflow），命令与上面一致。

## **兼容性**

已对照 master 提交 `47f943859b` 的 DeepSeek Harness 检出验证（2026-08-13）。当前发布线为 `0.1.0-rc.7`（npm 真实祖先：rc.2 → rc.3 → rc.6 → rc.7——0.1.0 线没有过 rc.4/rc.5），夜间 live 车道用真实浏览器直接起该线；本地开发以 devDependency `^0.1.0-rc.7` 跟随，typecheck 即漂移仲裁。已知最低可用契约即该提交所服务的：`settings.describe/mutate`、`llm.providers`、`{ rpcId, result }` envelope、模型行 schema。涉及内部界面面（settings.section 注册形态）的部分按 experimental compatibility 对待：更新版本若不服务该面，插件会静默降级而不是破坏页面。

## **License**

MIT
