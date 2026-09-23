# AIリーディング基盤 設計書

## 目的

タロット占いアプリに、確定済みのカードとユーザーの質問を解釈して文章化するAIリーディング機能を追加する。無料または低コストで開始し、AIモデル、プロバイダー、料金プランを変更しても、抽選ロジック、画面演出、記録機能を大きく変更しない構成とする。

初期リリースはワンオラクルのみを対象とする。カード図鑑、課金処理、5スプレッドの画面統合、78枚分の解釈執筆は初期リリースに含めない。ただし、それらを後から追加できるデータ契約を初期段階で固定する。

## 現状

- `one-oracle-flow-core.js` が大アルカナ22枚のシャッフル、カット、選択、確定を担当している。DOMや演出には依存していない。
- `one-oracle-art-ui.js` がワンオラクルの画面進行とアニメーションを担当し、確定後に `oracle:result` イベントを発行する。
- 現在の `oracle:result` は `cardId` のみを渡す。
- `oracle-messages.js` は大アルカナ22枚の正位置向け短文を保持している。
- `oracle-journal-ui.js` は `oracle:result` を受け、固定文章を表示してブラウザー内の記録へ保存する。
- `five-spread.html` は独立した試作で、カードデータ、抽選、表示、解釈が一つのHTMLに含まれている。新基盤へ直接接続せず、後の移行対象とする。
- フロントエンドはGitHub Pages上の静的ファイルで、現在はビルド工程を必要としない。

## 設計原則

1. カード抽選、正逆位置の決定、スプレッド、配置位置はアプリ側の決定論的なロジックとする。
2. AIはカードを選ばず、確定済みの結果を解釈して文章化する。
3. カードとスプレッドの定義は、AIがなくても利用できるローカルデータとする。
4. ブラウザーはAIプロバイダーの種類やAPIキーを知らない。
5. サーバーはクライアントから送られたカード解釈を信用せず、カードIDと配置IDから正規データを引く。
6. AI成功時とフォールバック時は同じ `readingResult` 契約を返す。
7. 既存のUIとアニメーションは、最終結果オブジェクトを受け取る表示層として維持する。
8. 医療、法律、投資、人命に関する断定や、占いだけで重大な判断を促す表現を生成しない。

## 全体構成

```text
OracleCore
  カード抽選・正逆位置・確定結果
        ↓
ReadingRequestBuilder
  質問・スプレッドID・カードID・配置IDを整形
        ↓
POST /api/reading
        ↓
ReadingService
  検証・辞書参照・入力構築・出力検証
        ↓
AIProvider
  Mock / Gemini / OpenAI / Cloudflare
        ↓
readingResult
        ↓
結果表示・ブラウザー内記録
```

`ReadingService` は特定のサーバーレス環境に依存しない純粋なサービス層とする。Cloudflare WorkerのHTTPハンドラーは薄い入口とし、将来別のホスティングへ移す場合もサービス層とプロバイダー層を再利用する。

## カードデータ

カードの正規データは `data/cards-major.json` に置く。識別子は表示名や配列位置ではなく、将来も変わらない文字列とする。

```json
{
  "schemaVersion": 1,
  "cards": [
    {
      "id": "major-21",
      "arcana": "major",
      "number": 21,
      "name": {
        "ja": "世界",
        "en": "The World"
      },
      "meanings": {
        "upright": {
          "general": "完成、統合、ひとつの区切り",
          "love": "関係が実を結ぶ、相互理解が深まる",
          "work": "目標達成、成果がまとまる",
          "finance": "積み重ねが安定につながる",
          "relationships": "互いの違いを含めて調和する",
          "action": "ここまでの達成を確認して次の目標を選ぶ"
        },
        "reversed": {
          "general": "未完成、あと一歩、区切りをつけにくい",
          "love": "関係の課題が残る、結論を急がない",
          "work": "仕上げや確認が必要",
          "finance": "見落とした条件を確認する",
          "relationships": "伝え残したことを整理する",
          "action": "不足している一工程を具体的に確認する"
        }
      }
    }
  ]
}
```

初期データは大アルカナ22枚とする。小アルカナは `minor-wands-ace` のような文字列IDを追加し、同じスキーマで78枚へ拡張する。既存コードの数値IDは初期移行時に `major-00` から `major-21` へ対応づけ、保存済み記録の互換性を保つ。

カード辞書はフロントエンドの簡易表示とサーバーのAI入力で共用する。公開ファイルはユーザーが閲覧できるため、秘密情報は含めない。サーバー側ではデプロイ時に同じJSONをバンドルし、ブラウザーから送られた意味本文は使用しない。

## スプレッドデータ

スプレッド定義は `data/spreads.json` に置く。

```json
{
  "schemaVersion": 1,
  "spreads": [
    {
      "id": "one-oracle",
      "name": "ワンオラクル",
      "cardCount": 1,
      "positions": [
        {
          "id": "message",
          "order": 1,
          "label": "今のあなたへのメッセージ",
          "meaning": "現在の問いに対して意識したい視点と行動"
        }
      ]
    }
  ]
}
```

3枚引き、二者択一、5スプレッド、ケルト十字も同じ構造で定義する。初期実装ではワンオラクルだけをアプリへ接続する。その他は、位置IDの一意性、枚数、順序を検証できる定義までを後続フェーズで追加する。

## 正逆位置と抽選結果

`OracleCore` がカード順と正逆位置を決定する。AI呼び出しや再試行で正逆位置を再抽選してはならない。

確定結果は次の内部形式とする。

```json
{
  "spreadId": "one-oracle",
  "cards": [
    {
      "positionId": "message",
      "cardId": "major-21",
      "orientation": "reversed"
    }
  ]
}
```

正逆位置の確率は抽選設定としてアプリ側に保持し、初期値は正位置50%、逆位置50%とする。将来、占い方式ごとの設定へ変更できるよう定数化する。テストでは乱数注入により再現可能にする。

## AI入力契約

ブラウザーから `/api/reading` へ送る要求は最小限とする。

```json
{
  "schemaVersion": 1,
  "question": "転職を迷っています",
  "spreadId": "one-oracle",
  "readingTier": "brief",
  "cards": [
    {
      "positionId": "message",
      "cardId": "major-21",
      "orientation": "reversed"
    }
  ],
  "output": {
    "locale": "ja-JP",
    "maxCharacters": 500
  }
}
```

制約は次のとおりとする。

- `question` は任意入力とし、初期上限は500文字とする。
- `spreadId` と `positionId` の組み合わせをサーバー側で検証する。
- `cardId` はカード辞書に存在するものだけを許可する。
- `orientation` は `upright` または `reversed` のみを許可する。
- `readingTier` は初期段階では `brief` のみ実装する。将来 `deep` を追加できる列挙値とする。
- `maxCharacters` はクライアントの希望値として受けるが、サーバーの上限を優先する。

サーバーは要求を検証後、質問のテーマに必要な意味だけを辞書から選ぶ。ワンオラクルで恋愛の質問なら、基本意味、恋愛、行動アドバイスを中心にし、不要な金運の意味はAIへ送らない。この選択により入力トークンを抑える。

## AI出力契約

すべてのプロバイダーとローカルフォールバックは同じ形式を返す。

```json
{
  "schemaVersion": 1,
  "readingId": "generated-id",
  "mode": "ai",
  "summary": "全体の結論",
  "interpretation": "質問とカード全体を結びつけた解釈",
  "cardReadings": [
    {
      "positionId": "message",
      "position": "今のあなたへのメッセージ",
      "cardId": "major-21",
      "card": "世界",
      "orientation": "reversed",
      "reading": "一区切りに近づいていますが、まだ確認したい点が残っている流れです。"
    }
  ],
  "advice": "現実的な行動アドバイス",
  "cautions": [
    "結果を固定された未来として扱わないでください"
  ]
}
```

`mode` は `ai` または `fallback` とする。UIはプロバイダー名を必要としないため、公開結果には含めない。運用ログではサーバー側だけにプロバイダー、モデル、処理時間、失敗種別、概算トークン数を記録できる設計とする。質問全文は既定で運用ログへ保存しない。

AI出力がJSONとして解析できない、必須項目がない、カードIDや配置が要求と一致しない、文字数が上限を大幅に超える場合は出力を不正とみなし、フォールバックへ切り替える。

## AIProvider抽象化

プロバイダー契約は次の一関数とする。

```js
generateReading(preparedInput, options) => Promise<providerResult>
```

`preparedInput` はサーバーが検証・補完したデータであり、プロバイダーはカード抽選を行わない。各プロバイダーはモデル固有の要求形式と応答形式だけを担当し、共通の `providerResult` へ変換する。

```text
server/
  api/reading.js
  core/reading-service.js
  core/prompt-builder.js
  core/result-validator.js
  providers/mock-provider.js
  providers/gemini-provider.js
  providers/openai-provider.js
  providers/cloudflare-provider.js
```

初期実装は `mock-provider.js` のみを有効にする。実プロバイダーは環境変数 `AI_PROVIDER` で選択する。APIキーとモデル名はサーバー環境変数へ置き、HTML、ブラウザーJavaScript、Gitリポジトリには保存しない。

Cloudflare Worker用のHTTP入口を最初の配置候補とするが、`reading-service.js`、辞書参照、検証、フォールバックはWeb標準APIと純粋なJavaScriptを中心にし、Cloudflare固有APIをHTTP入口と設定読込に限定する。

## プロンプト構築とコスト制御

システム指示はサーバー側に固定し、次の方針を含める。

- 提供されたカード辞書と配置意味を主情報源とする。
- カードの抽選、追加、置換、正逆位置の変更をしない。
- 未来を断定せず、可能性、流れ、傾向、現時点という表現を使う。
- 医療、法律、投資、人命に関する重大判断を占いだけで促さない。
- 質問とカードの接点、カード間の関係、現実的な行動を記述する。
- 指定されたJSON形式以外を返さない。

無料の `brief` は300〜500字を目安とする。入力には対象スプレッド、引かれたカード、該当分野の意味だけを含める。全22枚の辞書、未使用のスプレッド、過去の長い会話履歴は送らない。

将来の `deep` は同じ要求・応答スキーマを利用し、文字数、参照する意味、カード間分析の深さだけを変える。課金状態の判定はAIProviderではなく、API入口または利用権限層で行う。

## フォールバック

次の場合は自動的にローカル簡易リーディングを返す。

- AIプロバイダーのタイムアウト
- レート制限または無料枠超過
- ネットワーク障害
- プロバイダーの5xx応答
- JSON解析または出力検証の失敗
- サーバー設定でAIを無効にしている場合

フォールバックは辞書とスプレッド定義から、カード名、正逆位置、基本意味、配置位置、行動アドバイスを組み立てる。乱数を使わず、同じ入力には同じ基本結果を返す。HTTP応答自体は可能な限り成功扱いとし、`mode: "fallback"` でUIへ状態を伝える。

クライアント側にも同じ簡易生成器を配置し、`/api/reading` 自体へ到達できない場合の最終手段とする。簡易生成器は `reading/fallback-reading.js` を共用し、サーバーへもデプロイ時にバンドルする。サーバー用とクライアント用に別実装を複製しない。

## UI連携

既存の演出進行は変更しない。現在のイベント連携を次のように拡張する。

```text
oracle:result
  確定済みカード・正逆位置・配置ID
        ↓
reading-client.js
  API要求、タイムアウト、クライアントフォールバック
        ↓
reading:ready
  readingResult
        ↓
oracle-journal-ui.js
  表示・保存
```

通信中もカードは確定済みとし、再送で引き直さない。読み込み表示は結果領域内に追加し、アニメーション処理とは分離する。

既存の保存済み記録には `title`、`message`、`action` 形式があるため、新形式へ即時変換せず、表示時に旧形式と新形式の両方を読める互換処理を残す。新規記録は `readingResult` のスナップショット、質問、スプレッドID、カードID、正逆位置を保存できる版へ更新する。記録は引き続きブラウザー内に保存する。

AIへ質問を送る直前に、質問が外部AI処理のためサーバーへ送信されることを短く表示する。占い記録がブラウザー内保存であることとは区別して説明する。

## 安全性

- 質問入力は長さと型をクライアント・サーバー双方で検証する。
- HTMLとしてAI出力を挿入せず、文字列として描画する。
- APIキーはサーバー環境変数だけに置く。
- 公開APIにはレート制限、要求サイズ制限、タイムアウトを設定する。
- CORSは公開アプリのオリジンに限定できる構成とする。
- プロンプトインジェクション対策として、ユーザー質問を指示本文と区別した構造化データとして渡し、ユーザー入力による出力形式やカード結果の変更を認めない。
- 重大分野では専門家への相談を妨げず、緊急性が疑われる入力には占い結果より安全な案内を優先できるフックをサービス層に用意する。

## エラーとUX

- AI成功時は通常の結果として表示する。
- サーバーまたはクライアントのフォールバック時も占い結果を表示し、「今回は簡易リーディングを表示しています」と控えめに示す。
- 質問やカードデータが不正な場合は、AIへ送らず入力エラーとして扱う。
- API再試行は同じ確定結果を使い、一度だけに制限する。
- 結果の保存はAI成功・フォールバックのどちらでも利用できる。

## ファイル構成

初期実装で追加する候補は次のとおり。

```text
data/
  cards-major.json
  spreads.json
schemas/
  reading-request.schema.json
  reading-result.schema.json
reading/
  reading-request-builder.js
  reading-client.js
  fallback-reading.js
server/
  api/reading.js
  core/reading-service.js
  core/prompt-builder.js
  core/result-validator.js
  providers/mock-provider.js
tests/
  card-data.test.cjs
  spread-data.test.cjs
  reading-contract.test.cjs
  fallback-reading.test.cjs
```

既存ファイルの変更は原則として次の3つに限定する。

- `one-oracle-flow-core.js`: 正逆位置を確定結果へ追加する。
- `one-oracle-art-ui.js`: `oracle:result` にスプレッドID、配置ID、正逆位置を追加する。
- `oracle-journal-ui.js`: `readingResult` の表示と新旧記録形式の互換処理を追加する。

HTMLには新しいデータ・クライアントスクリプトの読込と、質問・通信状態に必要な最小要素だけを追加する。既存のCSS/SVGアニメーションは変更対象にしない。

## テスト方針

Node標準テストを継続して使用し、外部AIへ接続しないテストを基本とする。

- カードIDの一意性、22枚、必須分野、正逆位置の存在
- スプレッドID、位置ID、枚数、順序の整合性
- Fisher–Yates、カット、選択、正逆位置確定の再現可能性
- AI要求が確定カードを変更しないこと
- 不正なカードID、位置ID、orientation、長すぎる質問の拒否
- MockProviderから正常な `readingResult` を得ること
- タイムアウト、429、5xx、不正JSONでフォールバックすること
- AI結果とフォールバック結果が同じ出力契約を満たすこと
- 旧記録を表示でき、新記録を再読み込み後も復元できること
- AI出力や質問にHTML文字列が含まれても実行されないこと
- スマートフォン幅で質問、待機、結果、保存まで操作できること

Geminiなどの実プロバイダーは契約テスト用の固定応答を用い、通常の自動テストで料金が発生しないようにする。実API確認は明示的な手動テストとして分離する。

## 実装フェーズ

### フェーズ1: ワンオラクルのローカル基盤

1. カード・スプレッドデータと検証テスト
2. 要求・応答スキーマ
3. ReadingRequestBuilder
4. ローカルフォールバック
5. MockProviderとReadingService
6. 既存ワンオラクルから `readingResult` を表示
7. 記録形式の後方互換対応

この段階ではAI APIキーもWorker公開も不要で、GitHub Pages上のワンオラクルをモックまたはクライアントフォールバックで確認できる。

### フェーズ2: サーバーレスAPIと実AI

1. Cloudflare Worker互換の `/api/reading`
2. レート制限、タイムアウト、CORS、運用ログ
3. GeminiProvider
4. 質問送信に関する案内
5. 実APIの品質・料金評価
6. 必要に応じてOpenAIProviderまたはCloudflareProvider

### フェーズ3: 複数カード

ワンオラクルで出力契約と品質を固めた後、5スプレッドを同じ基盤へ移す。3枚引き、二者択一、ケルト十字はスプレッド定義と専用UIを追加する。AIProviderと結果表示契約は変更しない。

## 完了条件

初期ワンオラクル基盤は、次を満たした時点で完了とする。

- カード抽選とAI解釈が独立している。
- 大アルカナ22枚に正逆位置と指定された分野の意味がある。
- ワンオラクルの位置意味がデータ化されている。
- MockProviderで質問から構造化結果を表示できる。
- API障害を模擬しても簡易結果、演出、保存が機能する。
- UIはプロバイダー名やAPI固有形式を参照しない。
- APIキーが公開ファイル、Git履歴、ブラウザーへ含まれない。
- 既存の保存済み記録を引き続き読める。
- 自動テストとスマートフォン幅の一連操作が通る。

