<!-- hy-mt2-i18n:start -->
[English](./README.md) | **中文** | [日本語](./README_ja.md) | [Español](./README_es.md)
<!-- hy-mt2-i18n:end -->

<br>
<br>

<p align="center">
  <a href="https://mpp.dev">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="public/lockup-light.svg">
      <img alt="机器对机器支付协议" src="public/lockup-dark.svg" width="auto" height="120">
    </picture>
  </a>
</p>

<br>
<br>

# mpp

用于机器对机器支付的开放协议。

[![网站](https://img.shields.io/badge/website-mpp.dev-black)](https://mpp.dev)
[![IETF规范](https://img.shields.io/badge/spec-paymentauth.org-blue)](https://paymentauth.org)
[![许可证](https://img.shields.io/badge/license-MIT%2FApache--2.0-blue)](LICENSE-MIT)

[MPP](https://mpp.dev)，即机器支付协议，是由[Tempo](https://tempo.xyz)与[Stripe](https://stripe.com)共同制定的机器对机器支付开放标准。传统的付费HTTP服务通常要求先设置API密钥、账单账户或结账流程，客户端才能发起请求。而MPP则允许代理、应用及个人通过[HTTP `402 Payment Required`流程](https://mpp.dev/protocol/http-402)在发起请求的同时直接完成支付。其常见应用场景包括代理支付、按使用量计费以及机器对机器商务交易。

您今天就可以开始使用，方法包括阅读[协议概览](https://mpp.dev/protocol)、直接查看[快速入门指南](https://mpp.dev/quickstart)，或是了解[SDK信息](https://mpp.dev/sdk)。

## 该仓库包含什么

该仓库存放着[mpp.dev](https://mpp.dev)的源代码，同时也是MPP文档、协议说明、SDK参考资料以及正在运行的MPP支持服务列表的主要所在。无论您使用何种语言或平台，只要是对MPP尚不熟悉，都可以从这里开始学习。

# 文档资源
- 快速入门指南、协议说明文档以及 SDK 参考手册
- 服务目录：在 [mpp.dev/services](https://mpp.dev/services) 上可查询到所有支持 MPP 的服务列表

## 开发

```bash
pnpm install      # 安装依赖项
pnpm run dev      # 启动开发服务器
pnpm run build    # 进行生产环境构建
pnpm run check:sdk-drift # 根据 mppx 导出内容验证 SDK 参考页面
pnpm run preview  # 预览生产环境构建结果
```

### 发布博客文章

1. 将[`templates/blog-post.mdx`](templates/blog-post.mdx)复制到`src/pages/blog/<slug>.mdx`中。  
2. 替换标题、描述、日期、副标题以及正文内容。  
3. 运行`pnpm test`、`pnpm check:types`和`pnpm build`。

文章的前置元数据是唯一权威依据。构建流程会对其进行验证、整理博客索引、添加通用文章装饰元素、渲染语义化 Markdown，并生成 `/rss.xml` 文件。您无需编辑文章注册表，也无需在其他地方重复填写日期。

## 为服务目录做出贡献

[mpp.dev/services](https://mpp.dev/services) 上的服务目录精选了已上线且可直接投入生产的 MPP 服务。

### 向该仓库提交拉取请求

如果您希望将自己的服务加入精心筛选后的 `mpp.dev/services` 列表，请提交一个拉取请求并完成以下检查项：

#### 必须满足的条件

- [ ] 您的服务已正式上线，并可通过 MPP 接收付款（而非占位状态或即将上线状态）
- [ ] 您已将自己的服务条目添加到 `schemas/services.ts` 中
- [ ] 类型检查通过：`pnpm check:types`
- [ ] 构建成功：`pnpm build`

#### 推荐做法

- [ ] 在 [MPPScan](https://www.mppscan.com/register)（由 Merit Systems 提供）上注册您的服务。该平台遵循标准的 MPP 发现格式，能让代理立即发现您的服务，无需提交 Pull Request。

#### 审核标准

我们会优先考虑**高质量且具有创新性**的服务。对于那些功能与现有服务重复或尚未达到生产环境使用标准的服务，我们可能会不予批准。

### 添加新服务

1. **编辑 `schemas/services.ts` 文件**：在 `services` 数组中添加一条新记录：

```ts
{
  id: "my-service",
  name: "My Service",
  url: "https://example.com",
  serviceUrl: "https://api.example.com",
  description: "您的服务功能说明。",
  categories: ["ai"],
  integration: "first-party",
  tags: ["llm", "chat"],
  docs: {
    homepage: "https://docs.example.com",
    llmsTxt: "https://docs.example.com/llms.txt",
  },
  provider: { name: "Example Inc.", url: "https://example.com" },
  realm: MPP_REALM,
  intent: "charge",
  payment: TEMPO_PAYMENT,
  endpoints: [
    { route: "POST /v1/completions", desc: "生成补全内容", amount: "5000" },
    { route: "GET /v1/models", desc: "列出模型" },
  ],
}
```

## 贡献方式

欢迎对文档、服务目录以及网站功能进行优化方面的贡献。

### Pull request 检查清单

1. **类型检查通过**：`pnpm check:types`
2. **构建成功**：`pnpm build`
3. **代码格式检查通过**：`pnpm check`
4. **SDK 参考文档保持同步**（若修改了 SDK 文档或 `vocs.config.ts`）：`pnpm check:sdk-drift`
5. **端到端测试通过**（若修改了终端相关或交互式组件）：`pnpm test:e2e`

### 贡献类型

| 修改类型 | 处理流程 |
|-------------|---------|
| 拼写错误或编辑修正 | 直接向 `main` 分支提交 Pull Request |
| 新文档页面 | 遵循 `src/pages/` 中现有的页面结构 |
| 新服务条目 | 在 [MPPScan](https://www.mppscan.com/register) 上注册以便立即被发现；随后提交 Pull Request 将其加入精心整理的 `mpp.dev/services` 列表中 |
| 服务更新 | 编辑 `schemas/services.ts` 中的服务条目，重新生成后提交 Pull Request |
| 新组件 | 遵循 `src/components/` 中的规范 |
| 网站配置 | 先提交问题进行讨论 |

## SDKs

| 仓库地址 | 编程语言 |
|------------|----------|
| [wevm/mppx](https://github.com/wevm/mppx) | TypeScript |
| [tempoxyz/pympp](https://github.com/tempoxyz/pympp) | Python |
| [tempoxyz/mpp-rs](https://github.com/tempoxyz/mpp-rs) | Rust |
| [tempoxyz/mpp-go](https://github.com/tempoxyz/mpp-go) | Go |
| [stripe/mpp-rb](https://github.com/stripe/mpp-rb) | Ruby |
| [tempoxyz/mpp-specs](https://github.com/tempoxyz/mpp-specs) | 协议规范 |

## 安全性

如需报告漏洞，请参阅[`SECURITY.md`](./SECURITY.md)。

## 许可证

您可以根据自己的选择，依据[Apache License, Version 2.0](./LICENSE-APACHE)或[MIT License](./LICENSE-MIT)进行许可。

除非您明确说明其他情况，否则根据 Apache-2.0 许可证的定义，由您主动提交以纳入这些软件包的任何贡献，均应按照上述方式同时采用两种许可证进行授权，不得附加任何额外的条款或条件。
