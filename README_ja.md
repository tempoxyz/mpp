<!-- hy-mt2-i18n:start -->
[English](./README.md) | [中文](./README_zh-CN.md) | **日本語** | [Español](./README_es.md)
<!-- hy-mt2-i18n:end -->

<br>
<br>

<p align="center">
  <a href="https://mpp.dev">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="public/lockup-light.svg">
      <img alt="Machine Payments Protocol" src="public/lockup-dark.svg" width="auto" height="120">
    </picture>
  </a>
</p>

<br>
<br>

# mpp

マシン間決済向けのオープンプロトコルです。

# 厳格な制約
1. **構造の固定**：元のMarkdownデータ構造、インデント、見出し階層、表、リンク、URL、バッジ、コードブロック、インラインコードを一切変更しないこと。
2. **選択的翻訳**：ユーザーに表示される可視的な自然言語内容のみを翻訳すること。
3. **変更禁止**：コードタグ、キー名、変数プレースホルダー（{{var}}、${var}、%s、%dなど）、コマンド例、ファイルパス、プロジェクト名、API名、パッケージ名、モデル名、識別子、コード記号を翻訳または変更することは**厳禁**である。背景情報に対応する訳名が既に記載されている場合を除く。
4. 用語、スタイル、固有名詞の翻訳は、与えられた背景情報と一致させること。

[MPP](https://mpp.dev)、すなわちマシンペイメントプロトコルは、[Tempo](https://tempo.xyz)および[Stripe](https://stripe.com)によって共同で策定された、マシン間決済向けのオープンスタンダードです。通常、有料のHTTPサービスでは、クライアントがリクエストを送信する前にAPIキー、請求アカウント、またはチェックアウトフローの設定が必要となります。MPPを利用すれば、エージェントやアプリ、個人が[HTTP `402 Payment Required`フロー](https://mpp.dev/protocol/http-402)を通じて、リクエスト時にそのまま支払いを行うことができます。主な利用事例としては、エージェントによる支払い、使用量ベースの課金、マシン間コマースなどがあります。

今日からすぐに始めるには、[プロトコルの概要](https://mpp.dev/protocol)を読んだり、[クイックスタートガイド](https://mpp.dev/quickstart)に直接進んだり、[SDKについて詳しく見る](https://mpp.dev/sdk)ことができます。

## このリポジトリには何があるか

このリポジトリには[MPP.dev](https://mpp.dev)のソースコードが含まれています。ここはMPPのドキュメント、プロトコルの説明資料、SDKの参考情報、そして実際にMPPを利用しているサービスの一覧が集約された主要なポータルです。使用している言語やプラットフォームに関係なく、MPPを初めて使う方はまずここから始めてください。

# 機能概要
- **ドキュメント:** クイックスタートガイド、プロトコル解説書、SDKリファレンス
- **サービスディレクトリ:** [mpp.dev/services](https://mpp.dev/services)にあるMPP対応サービスの一覧リポジトリ

## 開発

```bash
pnpm install      # 依存関係のインストール
pnpm run dev      # 開発サーバーの起動
pnpm run build    # 実環境向けのビルド
pnpm run check:sdk-drift # mppxのエクスポート内容とSDKリファレンスページを照合して検証
pnpm run preview  # 実環境向けビルドのプレビュー
```

### ブログ記事を公開する

1. `templates/blog-post.mdx` を `src/pages/blog/<slug>.mdx` にコピーします。  
2. タイトル、説明文、日付、サブタイトル、本文を置き換えます。  
3. `pnpm test`、`pnpm check:types`、`pnpm build` を実行します。

フロントマターが唯一の真実の情報源です。ビルドプロセスではそれを検証し、ブログのインデックスを整理し、共通のポストエレメントを追加し、セマンティックなMarkdownをレンダリングし、/rss.xmlを生成します。ポストの登録情報を編集したり、日付を別の場所に複製したりする必要はありません。

## [mpp.dev/services]のサービスディレクトリへの貢献

[mpp.dev/services](https://mpp.dev/services) にあるサービスディレクトリには、実際に運用中で本番環境向けの MPP サービスのみが厳選して掲載されています。

### このリポジトリにプルリクエストを送信する

ご自身のサービスを厳選された `mpp.dev/services` のリストに掲載したい場合は、Pull Request を開き、このチェックリストを完了してください：

#### 必須要件

- [ ] お使いのサービスはMPP経由で**実際に稼働しており、支払いを受け付けている**（プレースホルダーや近日公開予定ではない）  
- [ ] `schemas/services.ts` にエントリが追加されている  
- [ ] 型チェックに合格：`pnpm check:types`  
- [ ] ビルドに成功：`pnpm build`

#### 推奨事項

- [ ] Merit Systemsが運営する[MPPScan](https://www.mppscan.com/register)にサービスを登録してください。こちらは標準的なMPPディスカバリ形式に従っており、PRを行わなくてもエージェントによって即座にサービスが検出されます。

#### レビュー基準

当方では、**高品質かつ独創性のある**サービスを優先的に取り上げます。既存の機能と重複するサービスや、まだ本番環境での利用に適していないサービスについては、承認しない場合があります。

### 新しいサービスを追加する

1. **`schemas/services.ts` を編集する：** `services` 配列に新しいエントリを追加します：

```ts
{
  id: "my-service",
  name: "My Service",
  url: "https://example.com",
  serviceUrl: "https://api.example.com",
  description: "サービスの機能について。",
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
    { route: "POST /v1/completions", desc: "補完内容の生成", amount: "5000" },
    { route: "GET /v1/models", desc: "モデルの一覧表示" },
  ],
}
```

## 貢献するには

ドキュメント、サービスディレクトリ、およびサイトの改善に関する貢献は歓迎されています。

### Pull request のチェックリスト

1. **Types pass**: `pnpm check:types`
2. **Build succeeds**: `pnpm build`
3. **Lint passes**: `pnpm check`
4. **SDK references stay in sync** (if touching SDK docs or `vocs.config.ts`): `pnpm check:sdk-drift`
5. **E2E tests pass** (if touching terminal or interactive components): `pnpm test:e2e`

### 貢献の種類

| 変更タイプ | 手順 |
|-------------|---------|
| 打ち間違いや編集上の修正 | 直接に `main` へ PR を送信 |
| 新しいドキュメントページ | `src/pages/` 内の既存のページ構造に従う |
| 新しいサービスの登録 | 即時に検出されるよう [MPPScan](https://www.mppscan.com/register) に登録し、厳選された `mpp.dev/services` リストに含めるために PR を開く |
| サービスの更新 | `schemas/services.ts` 内のサービスエントリを編集し、再生成してから PR を送信 |
| 新しいコンポーネント | `src/components/` 内のパターンに従う |
| サイト設定 | まず議論のために Issue を開く |

## SDKs

| リポジトリ | 言語 |
|------------|----------|
| [wevm/mppx](https://github.com/wevm/mppx) | TypeScript |
| [tempoxyz/pympp](https://github.com/tempoxyz/pympp) | Python |
| [tempoxyz/mpp-rs](https://github.com/tempoxyz/mpp-rs) | Rust |
| [tempoxyz/mpp-go](https://github.com/tempoxyz/mpp-go) | Go |
| [stripe/mpp-rb](https://github.com/stripe/mpp-rb) | Ruby |
| [tempoxyz/mpp-specs](https://github.com/tempoxyz/mpp-specs) | プロトコル仕様 |

## セキュリティ

脆弱性の報告については、[`SECURITY.md`](./SECURITY.md)をご覧ください。

## ライセンス

[Apache License, Version 2.0](./LICENSE-APACHE) または [MIT License](./LICENSE-MIT) のいずれかに基づき、ご希望に応じてライセンスされます。

特に別途指定がない限り、Apache-2.0ライセンスで定義されているとおり、あなたがこれらのクレートに含める目的で意図的に提出したすべての貢献物は、追加の利用規約や条件なしに上記と同様の二重ライセンスの対象となります。
