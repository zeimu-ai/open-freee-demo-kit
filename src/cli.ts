#!/usr/bin/env node
import { Command } from 'commander';
import { authCommand } from './commands/auth.js';
import { whoamiCommand } from './commands/whoami.js';
import { listCommand } from './commands/list.js';
import { loadCommand } from './commands/load.js';
import { loadAllCommand } from './commands/load-all.js';
import { resetCommand } from './commands/reset.js';
import { validateCommand } from './commands/validate.js';
import { dryRunCommand } from './commands/dry-run.js';
import { verifyCommand } from './commands/verify.js';
import { statusCommand } from './commands/status.js';

const program = new Command();

program
  .name('fdk')
  .description('freee demo kit — Load demo data into your freee test company')
  .version('0.1.0');

program.addCommand(authCommand);
program.addCommand(whoamiCommand);
program.addCommand(listCommand);
program.addCommand(loadCommand);
program.addCommand(loadAllCommand);
program.addCommand(resetCommand);
program.addCommand(validateCommand);
program.addCommand(dryRunCommand);
program.addCommand(verifyCommand);
program.addCommand(statusCommand);

program.parse();
