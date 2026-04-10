import { Command } from 'commander';
import { listAllStates } from '../utils/state-store.js';

export const statusCommand = new Command('status')
  .description('Show all loaded presets and their record counts from state.json')
  .action(async () => {
    const states = await listAllStates();

    if (states.length === 0) {
      console.log('\n📭 投入済みプリセットなし');
      console.log('   fdk load <preset> でデモデータを投入してください。\n');
      return;
    }

    console.log(`\n📦 投入済みプリセット (${states.length}件):`);
    console.log('─'.repeat(52));

    for (const state of states) {
      const loadedAt = new Date(state.loadedAt).toLocaleString('ja-JP', {
        timeZone: 'Asia/Tokyo',
      });
      console.log(`  ${state.preset}`);
      console.log(`    口座 ${state.walletableIds.length}件 | 取引 ${state.dealIds.length}件 | 仕訳 ${state.manualJournalIds.length}件 | 証憑 ${state.receiptIds.length}件`);
      console.log(`    投入日時: ${loadedAt}`);
    }

    console.log('─'.repeat(52));
    console.log('');
  });
