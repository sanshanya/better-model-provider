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

1. 先在官方「模型」页配好供应商与 API 密钥——密钥和路由的启用/停用始终归官方页管理，本页不重复这些功能。
2. 展开某个模型行，直接改它的能力：
   - **推理强度**：选「自定义」，勾需要的档位；希望「关」这一档也开放，就把 off 一并勾上（取值可留空）。
   - **视觉模型**：在输入模态里勾上 image——不勾，聊天里发图给这个模型会被拒收。
   - **容量**：直接填，K/M 写法更直观（`380K`、`1M`)。改完点「应用」立即生效。
3. 官方目录路由（官方已交给模型目录的路由）：点「管理官方模型」后改。我们的每处改动只记「与官方默认不同的那一点」——其余部分官方日后更新了也照样跟随；改错了用「还原为官方默认」一键撤销该模型的全部改动。
4. 「管理官方供应商（N）」里可以翻出还没配置的官方路由：选它、应用第一个改动，这条路由就诞生了。API 密钥仍需在官方页设。

内置的「DeepSeek」「OpenAI Codex」等专属适配器在它们自己的设置页声明能力，本页不显示他们。

## 兼容性

我们声明兼容**整个 dsh 0.1.x 系**：契约 `@deepseek-ai/dsh-api-remotes >=0.1.0-rc.7 <0.2.0`，live 车道已在 rc.7、rc.8、0.1.1-rc.2 及 0.1.2-alpha.1 源树 master 上实证。契约之外的能力面静默降级。开发门禁、live 车道与不变式见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可证

MIT
