import { Command } from 'commander';

export const authCommand = new Command('auth')
  .description('Authenticate with freee via OAuth 2.0')
  .option('--status', 'Show current authentication status')
  .option('--logout', 'Remove stored credentials')
  .action((options) => {
    if (options.status) {
      console.log('[auth] Status check — not yet implemented');
      return;
    }
    if (options.logout) {
      console.log('[auth] Logout — not yet implemented');
      return;
    }
    console.log('[auth] OAuth flow — not yet implemented');
    console.log('Coming soon: fdk auth will open your browser to authenticate with freee');
  });
