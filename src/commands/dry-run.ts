import { Command } from 'commander';

export const dryRunCommand = new Command('dry-run')
  .description('Simulate loading a preset without making API calls')
  .argument('<preset>', 'Preset name to simulate')
  .action((preset: string) => {
    console.log(`[dry-run] Simulating preset: ${preset} — not yet implemented`);
    console.log('Coming soon: fdk dry-run will show a detailed preview of all data to be loaded');
  });
