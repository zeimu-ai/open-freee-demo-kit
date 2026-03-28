import { Command } from 'commander';

export const resetCommand = new Command('reset')
  .description('Delete all demo data from the freee sandbox company')
  .option('--preset <name>', 'Reset only a specific preset')
  .option('--dry-run', 'Show what would be deleted without actually deleting')
  .action((options) => {
    if (options.dryRun) {
      console.log('[reset] Dry run — not yet implemented');
      console.log('Coming soon: fdk reset --dry-run will preview all data to be deleted');
      return;
    }
    if (options.preset) {
      console.log(`[reset] Resetting preset: ${options.preset} — not yet implemented`);
      return;
    }
    console.log('[reset] Resetting all data — not yet implemented');
    console.log('Coming soon: fdk reset will delete all demo data (journals → deals → walletables → account_items)');
  });
