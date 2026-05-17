直前の編集で変更されたファイルに対してLinterを実行してください。

手順:
1. `git diff --name-only HEAD` と `git diff --name-only --cached` を実行して変更済みファイルの一覧を取得する。コミット済みの場合は `git diff --name-only HEAD~1 HEAD` も確認する。
2. 取得したファイルのうち、`.ts` `.tsx` `.js` `.jsx` の拡張子を持つものを対象にする。
3. 対象ファイルを `backend/` 配下と `frontend/` 配下に分類し、それぞれのディレクトリで `npx eslint <ファイルパス>` を実行する。
4. Lintエラーがあれば内容を報告し、`--fix` で自動修正可能かどうかを案内する。エラーがなければ「Lintエラーなし」と報告する。
