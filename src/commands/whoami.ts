import { Command } from 'commander';
import { FreeeApiClient } from '../utils/freee-api.js';
import { loadTokens } from '../utils/token-store.js';

export const whoamiCommand = new Command('whoami')
  .description('Show authenticated user and company information')
  .action(async () => {
    const tokens = await loadTokens();
    if (!tokens) {
      console.error('Not authenticated. Run `fdk auth` to authenticate with freee.');
      process.exit(1);
    }

    try {
      const client = new FreeeApiClient();
      const me = await client.getMe();

      console.log(`User: ${me.display_name}`);
      console.log(`Email: ${me.email}`);
      if (me.companies && me.companies.length > 0) {
        console.log('Companies:');
        for (const company of me.companies) {
          const isCurrent = tokens.company_id === company.id;
          console.log(`  ${isCurrent ? '▶' : ' '} [${company.id}] ${company.display_name || company.name}`);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  });
