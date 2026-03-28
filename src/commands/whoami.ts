import { Command } from 'commander';

export const whoamiCommand = new Command('whoami')
  .description('Show authenticated user and company information')
  .action(() => {
    console.log('[whoami] — not yet implemented');
    console.log('Coming soon: fdk whoami will display your freee account and company details');
  });
