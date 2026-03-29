import * as readline from 'node:readline';

/**
 * write 系コマンド実行前に事業所名を表示してユーザーに確認を求める。
 * --yes フラグが true の場合はスキップして即 true を返す。
 * デフォルト（空エンター）は No。
 */
export async function confirmCompany(
  companyName: string,
  companyId: number,
  yes: boolean
): Promise<boolean> {
  if (yes) return true;

  console.log(`\n⚠️  対象事業所: ${companyName} (ID: ${companyId})`);
  console.log('   この事業所にデータを書き込みます。');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  return new Promise(resolve => {
    rl.question('   続行しますか？ [y/N]: ', answer => {
      rl.close();
      resolve(answer === 'y' || answer === 'Y');
    });
  });
}
