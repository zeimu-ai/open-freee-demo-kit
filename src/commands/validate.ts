import { Command } from 'commander';

export const validateCommand = new Command('validate')
  .description('Validate preset JSON files against the schema')
  .action(() => {
    console.log('[validate] — not yet implemented');
    console.log('Coming soon: fdk validate will check all preset JSON files for schema compliance');
  });
