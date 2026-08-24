# better-model-provider

为 DeepSeek Harness 提供按模型的能力编辑：推理强度档位（含取值拼写）、请求模态与 token 容量——自定义路由上编辑声明，官方目录路由上编辑稀疏覆盖。

**自定义模型：编辑声明。官方模型：编辑覆盖。供应商配置仍归官方。**

[English](README.md)

![编辑一个模型行](https://raw.githubusercontent.com/sanshanya/better-model-provider/main/docs/screenshot.png)

## 为什么

`reasoningEfforts` 与 `input` 这两个按模型字段此前只能手写 YAML：不声明，选择器就没有强度控件，图像会话还会拒收该模型（`... does not accept image input`)。本页把这两个字段连同 `contextWindow` / `maxTokens` 一起纳入编辑——一行配好一个模型。

## 安装

    dsh plugin --profile web add github:sanshanya/better-model-provider#master

CI 在 main 每次全绿后自动重建并发布成品到 `master` 分支，此路径零本机构建。装默认分支（`github:sanshanya/better-model-provider`）则本地构建：按提示为 pnpm 增加一个 `allowBuilds` 键后重跑 `add`；本地 `link:` 安装须先 `npm install && npm run build`。重启 `dsh web`，设置侧栏即现「模型能力」。

    dsh plugin --profile web rm better-model-provider

## 使用

1. 先在官方「模型」页配置供应商与 API 密钥；密钥与生命周期永远不出走本页。
2. 展开某行：推理强度选「自定义」并勾选档位（需要 Off 就再勾 `off`，取值留空 → `null`)；视觉模型在输入模态里勾 `image`；容量支持 K/M 写法（`380K`、`1M`)。应用后选择器与图像准入立即生效。
3. 官方目录路由：点击「管理官方模型」——每个字段只写一个稀疏 `modelOverrides` 叶子；官方容量基线除非覆盖否则不动；推理取值绝不替你猜；「还原为官方默认」恰好摘掉你覆盖过的叶子。
4. 「管理官方供应商（N）」列出每个驻装的目录路由；点选其一，你应用的第一个覆盖即会创建它的 profile。

内置的「DeepSeek」「OpenAI Codex」等专属适配器应用的能力在它们自己的设置页声明，不会出现在本页。

## 兼容性

我们声明兼容**整个 dsh 0.1.x 系**：契约 `@deepseek-ai/dsh-api-remotes >=0.1.0-rc.7 <0.2.0`，live 车道已在 rc.7、rc.8、0.1.1-rc.2 三个版本上实证。契约之外的能力面静默降级。开发门禁、live 车道与不变式见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可证

MIT
