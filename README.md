# マルシェポータル

イベント主催者と出展者を繋ぐマッチングプラットフォーム

## 機能

- 🎪 **イベント管理** - イベントの作成・編集・管理
- 👥 **出展者登録** - 出展者の募集・管理
- 🔍 **検索機能** - 都道府県・日付・カテゴリーでイベント検索
- 💳 **決済機能** - Stripeによる安全な決済処理
- 📱 **PWA対応** - モバイルアプリとしても利用可能
- 🔐 **認証システム** - 安全なユーザー認証

## 技術スタック

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **データベース**: PostgreSQL + Prisma ORM
- **認証**: NextAuth.js
- **決済**: Stripe
- **アイコン**: Lucide React
- **UIコンポーネント**: Radix UI

## セットアップ

### 必要要件

- Node.js 18以上
- PostgreSQLデータベース
- Stripeアカウント（決済機能用）

### インストール

1. リポジトリをクローン
```bash
git clone [repository-url]
cd marche-portal
```

2. 依存関係をインストール
```bash
npm install
```

3. 環境変数を設定
```bash
cp .env.example .env.local
# .env.localファイルを編集して必要な環境変数を設定
```

4. データベースをセットアップ
```bash
npx prisma migrate dev
npx prisma generate
```

5. 開発サーバーを起動
```bash
npm run dev
```

## 環境変数

`.env.example`を参考に`.env.local`ファイルを作成し、以下の環境変数を設定してください：

- `DATABASE_URL`: PostgreSQLデータベースのURL
- `NEXTAUTH_URL`: アプリケーションのURL
- `NEXTAUTH_SECRET`: NextAuth.jsのシークレットキー
- `STRIPE_SECRET_KEY`: StripeのシークレットAPIキー
- その他Stripe、Google Sheets、LINE LIFF関連の設定

## ディレクトリ構造

```
src/
├── app/              # Next.js App Router
├── components/       # Reactコンポーネント
│   ├── ui/          # 再利用可能なUIコンポーネント
│   └── layout/      # レイアウトコンポーネント
├── lib/             # ユーティリティ関数
└── types/           # TypeScript型定義
```

## 料金プラン

- **無料プラン**: イベント検索・出展者登録
- **プレミアムプラン**: 月額5,000円（最初の2ヶ月無料）
  - 無制限のイベント作成
  - 高度な管理機能
  - 優先サポート

## ライセンス

Private

## サポート

質問や問題がある場合は、Issueを作成してください。
