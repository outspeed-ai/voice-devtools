#!/usr/bin/env node

import chalk from 'chalk';
import { execSync } from 'child_process';
import { config } from 'dotenv';
import figlet from 'figlet';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
config();

// Pretty print Outspeed
console.log(chalk.blue(figlet.textSync('Outspeed', {
  font: 'Standard',
  horizontalLayout: 'default',
  verticalLayout: 'default'
})));

// Check environment variables from .env
const envPath = join(process.cwd(), '.env');
const envContent = readFileSync(envPath, 'utf-8');
const envVars = {
  OPENAI_API_KEY: envContent.includes('OPENAI_API_KEY') && !!process.env.OPENAI_API_KEY,
  OUTSPEED_API_KEY: envContent.includes('OUTSPEED_API_KEY') && !!process.env.OUTSPEED_API_KEY
};

console.log('\nChecking environment variables:');
Object.entries(envVars).forEach(([key, exists]) => {
  console.log(`${exists ? chalk.green('✓') : chalk.red('✗')} ${key}`);
});

if (!envVars.OPENAI_API_KEY || !envVars.OUTSPEED_API_KEY) {
  console.log(chalk.yellow('\n⚠️  Warning: Some required environment variables are missing in .env'));
  process.exit(1);
}

// Check if logged into Cloudflare
try {
  execSync('npx wrangler whoami', { stdio: 'inherit' });
} catch (error) {
  console.log(chalk.yellow('\n🔑 Not logged into Cloudflare. Opening browser for login...'));
  try {
    execSync('npx wrangler login', { stdio: 'inherit' });
  } catch (loginError) {
    console.error(chalk.red('\n❌ Failed to complete Cloudflare login. Please try again.'));
    process.exit(1);
  }
}

// Cloudflare deployment message
console.log(chalk.cyan('\n🚀 Deploying to Cloudflare Workers...'));

try {
  // Construct the deploy command with environment variables
  const deployCommand = [
    'npx wrangler deploy',
    `--var OPENAI_API_KEY="${process.env.OPENAI_API_KEY}"`,
    `--var OUTSPEED_API_KEY="${process.env.OUTSPEED_API_KEY}"`
  ].join(' ');

  // Run wrangler deploy with environment variables
  const deployOutput = execSync(deployCommand, { 
    encoding: 'utf-8',
    stdio: ['inherit', 'pipe', 'inherit'] // Inherit stdin, pipe stdout, inherit stderr
  });
  
  // Extract the worker.dev URL from the output
  // This regex will match:
  // - URLs with any amount of whitespace at the start
  // - URLs that might be part of a longer line
  // - URLs with different subdomains
  // - URLs with or without www
  // - URLs that might have query parameters
  const workerUrlMatch = deployOutput.match(/\bhttps?:\/\/[a-z-.]*\.workers\.dev/g);
  
  if (workerUrlMatch) {
    const workerUrl = workerUrlMatch[0].trim();
    console.log(chalk.green('\n✨ Deployment successful!'));
    console.log(chalk.blue(`Worker URL: ${workerUrl}`));
  } else {
    console.log(chalk.yellow('\n⚠️  Could not find worker URL in deployment output'));
    console.log(chalk.yellow('Deployment output:'));
    console.log(deployOutput);
  }
} catch (error) {
  console.error(chalk.red('\n❌ Deployment failed:'));
  console.error(error.message);
  process.exit(1);
} 