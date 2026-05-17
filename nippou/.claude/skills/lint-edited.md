---
name: lint-edited
description: エージェントがファイルを編集し終わった後、変更されたファイルに対してESLintを実行するスキル。TypeScript/JavaScriptファイルのLintエラーを検出・報告する。
allowed-tools: Bash,Read,Glob
---

# lint-edited

## Instructions

1. `git diff --name-only HEAD` を実行して未コミットの変更ファイル一覧を取得する。結果が空の場合は `git diff --name-only HEAD~1 HEAD` でコミット済みの直近変更を取得する。
2. 取得したファイルのうち `.ts` `.tsx` `.js` `.jsx` 拡張子のものだけを対象にする。対象ファイルがなければ「Lintの対象となるファイルがありません」と報告して終了する。
3. 対象ファイルを `backend/` 配下と `frontend/` 配下に分類する。
4. `backend/` のファイルがある場合、`/workspace/backend` ディレクトリで `npx eslint <ファイルパス>` を実行する。
5. `frontend/` のファイルがある場合、`/workspace/frontend` ディレクトリで `npx eslint <ファイルパス>` を実行する。
6. 結果を報告する：
   - エラー・警告がある場合：ファイルごとに内容を列挙し、`--fix` で自動修正できるものがあれば案内する
   - すべてクリーンな場合：「Lintエラーなし」と報告する

## Example

ユーザー：「/lint-edited」

エージェントは git diff で変更ファイルを特定し、backend/src/routes/dailyReports.ts が変更されていた場合、`/workspace/backend` で `npx eslint backend/src/routes/dailyReports.ts` を実行してエラーがあれば報告する。
