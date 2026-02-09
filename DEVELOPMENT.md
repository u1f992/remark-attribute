# 開発ノート

## TypeScript セットアップ

### テストファイルの分離

テストファイルは `src/` ではなく `test/` ディレクトリに配置する。

`src/` にテストを混在させて `tsconfig.json` の `exclude` でテストを除外する方法は、
`exclude` を明示指定すると `outDir` のデフォルト除外が上書きされ、
`dist/` 内の `.d.ts` が入力ファイルとして認識されてしまう問題がある。

> `exclude` のデフォルト値は `["node_modules", "bower_components", "jspm_packages", <outDir>]`。
> 明示指定するとこのデフォルトが置き換えられる。
> ただし `node_modules` は別の仕組みで常に除外されるため影響を受けない。

### Node.js ネイティブ type stripping によるテスト実行

テストファイルはトランスパイルせず、Node.js のネイティブ type stripping で直接実行する。

- `src/` 内の相対インポートは `.ts` 拡張子を使用する
- `tsconfig.json` に `rewriteRelativeImportExtensions: true` を設定し、ビルド時に `.ts` → `.js` に書き換える
- `tsconfig.test.json` は `noEmit: true` で型チェックのみ行う
- テスト実行: `node --test "test/**/*.test.ts"`

### tsconfig 構成

```
packages/<name>/
├── src/           # ソースコード
├── test/          # テストファイル
├── dist/          # ビルド出力（src のみ）
├── tsconfig.json       # ビルド用
└── tsconfig.test.json  # テスト型チェック用（noEmit, types: ["node"]）
```

#### `tsc --init` からの変更点

`tsc --init` で生成されるデフォルトの `tsconfig.json` に対して、以下の変更が必要:

- `rootDir` / `outDir` のアンコメント
- `rewriteRelativeImportExtensions: true` を追加（`.ts` インポートをビルド時に `.js` に書き換える）
- `include: ["src"]` を追加（`test/` が `rootDir` の範囲外であるため、明示的に `src` のみに限定する必要がある）

`tsconfig.test.json` は手動で作成する。`tsconfig.json` を継承するが、
`include: ["src"]` も継承されるため `include: ["src", "test"]` で上書きする必要がある。

## アップストリーム追従ファイル

### `micromark-extension-attribute/src/factory-attributes.js`

このファイルは `micromark-extension-directive` の `dev/lib/factory-attributes.js` を
**無改変でコピー**したものである。`{...}` 属性構文のパーサ（状態機械）はこのプロジェクトの
中核ロジックだが、`micromark-extension-directive` と完全に共有されるコードのため、
upstream の変更を容易に取り込めるよう原本のまま保持する。

#### 設計判断

- ファイル形式は upstream に合わせて **JavaScript（JSDoc 型注釈付き）** のまま使用する
- `tsconfig.json` に `allowJs: true` を設定し、TypeScript コンパイラが
  JSDoc から `.d.ts` を生成する
- `.ts` ファイルからは `import ... from "./factory-attributes.js"` でインポートする
- ESLint（`eslint.config.js` の `ignores`）と Prettier（`.prettierignore`）の
  対象外としており、フォーマッタによる差分が発生しない

#### upstream 更新の手順

1. upstream リポジトリから最新の `dev/lib/factory-attributes.js` を取得する
2. 差分を確認する:
   ```bash
   diff micromark-extension-directive/dev/lib/factory-attributes.js \
        remark-attribute/packages/micromark-extension-attribute/src/factory-attributes.js
   ```
3. ファイルを上書きコピーする
4. `npm run build && npm test` で動作確認する
