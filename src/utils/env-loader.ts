import { config } from 'dotenv';

/**
 * .env ファイルを読み込み、process.env に設定する。
 * ファイルが存在しない場合はエラーにならず、何もしない。
 * 既に設定済みの環境変数は上書きしない（dotenv デフォルト動作）。
 *
 * @param path - 読み込む .env ファイルのパス（省略時はカレントディレクトリの .env）
 */
export function loadEnv(path?: string): void {
  config({ path, override: false, quiet: true });
}
