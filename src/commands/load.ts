import { Command } from 'commander';

export const loadCommand = new Command('load')
  .description('Load a specific preset into the freee sandbox company')
  .argument('<preset>', 'Preset name to load')
  .action((preset: string) => {
    console.log(`[load] Loading preset: ${preset} — not yet implemented`);
    console.log('Coming soon: fdk load will inject demo data from the specified preset');
  });
