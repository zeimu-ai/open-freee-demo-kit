import { Command } from 'commander';
import { loadTokens, clearTokens, isTokenExpired } from '../utils/token-store.js';
import { FreeeApiClient } from '../utils/freee-api.js';
import { error as logError } from '../utils/logger.js';
import { runOAuthPkceFlow } from '../utils/auth-flow.js';

export const authCommand = new Command('auth')
  .description('Authenticate with freee via OAuth 2.0')
  .option('--status', 'Show current authentication status')
  .option('--logout', 'Remove stored credentials')
  .action(async (options) => {
    if (options.status) {
      const tokens = await loadTokens();
      if (!tokens) {
        console.log('Not authenticated. Run `fdk auth` to authenticate.');
        return;
      }
      const expired = isTokenExpired(tokens);
      const expiresAt = new Date(tokens.expires_at).toLocaleString('ja-JP');
      console.log(`Authentication status:`);
      console.log(`  Token: ${expired ? '⚠️  Expired' : '✅ Valid'}`);
      console.log(`  Expires at: ${expiresAt}`);
      if (tokens.company_id) {
        console.log(`  Company ID: ${tokens.company_id}`);
      }

      if (!expired) {
        try {
          const client = new FreeeApiClient();
          const me = await client.getMe();
          console.log(`  User: ${me.display_name} (${me.email})`);
        } catch {
          console.log('  (Could not fetch user info)');
        }
      }
      return;
    }

    if (options.logout) {
      await clearTokens();
      console.log('✅ Logged out. Credentials removed.');
      return;
    }

    console.log('\nOpening browser for freee authentication...');

    try {
      const result = await runOAuthPkceFlow((url) => {
        console.log(`If the browser does not open, visit:\n  ${url}\n`);
      });
      console.log(`\n✅ Authenticated as: ${result.displayName} (${result.email})`);
      if (result.companies.length > 0) {
        console.log(`   Companies available: ${result.companies.map(c => `${c.name} (ID:${c.id})`).join(', ')}`);
      }
    } catch (err) {
      logError(String(err));
      process.exit(1);
    }
  });
