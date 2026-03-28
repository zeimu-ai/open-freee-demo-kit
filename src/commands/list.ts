import { Command } from 'commander';

export const listCommand = new Command('list')
  .description('Show available presets')
  .action(() => {
    console.log('[list] — not yet implemented');
    console.log('Coming soon: fdk list will display all available demo data presets');
  });
