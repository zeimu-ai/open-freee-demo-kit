import { Command } from 'commander';

export const loadAllCommand = new Command('load-all')
  .description('Load all available presets into the freee sandbox company')
  .option('--dry-run', 'Show what would be loaded without actually loading')
  .option('--delay <ms>', 'Delay between API calls in milliseconds', '100')
  .action((options) => {
    if (options.dryRun) {
      console.log('[load-all] Dry run — not yet implemented');
      console.log('Coming soon: fdk load-all --dry-run will preview all data to be loaded');
      return;
    }
    console.log(`[load-all] Loading all presets (delay: ${options.delay}ms) — not yet implemented`);
    console.log('Coming soon: fdk load-all will inject all demo data presets');
  });
