#!/usr/bin/env node

import tailwindcss from '@tailwindcss/vite';
import react from "@vitejs/plugin-react";
import chalk from 'chalk';
import { execSync } from 'child_process';
import { config } from 'dotenv';
import figlet from 'figlet';
import { readFileSync } from 'fs';
import { join } from 'path';
import { build } from 'vite';

// Load environment variables
config();

// Debug environment variables
console.log(chalk.dim('\nEnvironment Variables:'));
console.log(chalk.dim('OPENAI_API_KEY:'), process.env.OPENAI_API_KEY 
  ? `${process.env.OPENAI_API_KEY.slice(0, 3)}...${process.env.OPENAI_API_KEY.slice(-4)}` 
  : 'Not set');
console.log(chalk.dim('OUTSPEED_API_KEY:'), process.env.OUTSPEED_API_KEY 
  ? `${process.env.OUTSPEED_API_KEY.slice(0, 3)}...${process.env.OUTSPEED_API_KEY.slice(-4)}` 
  : 'Not set');

// Pretty print Outspeed
console.log(chalk.blue(figlet.textSync('Outspeed', {
  font: 'Standard',
  horizontalLayout: 'default',
  verticalLayout: 'default'
})));

// Function to deploy server to Cloudflare Workers
async function deployServer() {
  console.log(chalk.cyan('\n🚀 Deploying server to Cloudflare Workers...'));
  
  try {
    const deployCommand = [
      'npx wrangler deploy',
      `--var OPENAI_API_KEY:${process.env.OPENAI_API_KEY}`,
      `--var OUTSPEED_API_KEY:${process.env.OUTSPEED_API_KEY}`
    ].join(' ');

    console.log(chalk.dim('┌─────────────────────────────────────────────────────────────┐'));
    console.log(chalk.dim('│                     Deployment started                      │'));
    console.log(chalk.dim('└─────────────────────────────────────────────────────────────┘'));
    
    const deployOutput = execSync(deployCommand, { 
      encoding: 'utf-8',
      stdio: ['inherit', 'pipe', 'inherit']
    });
    
    const workerUrlMatch = deployOutput.match(/\bhttps?:\/\/[a-z-.]*\.workers\.dev/g);
    
    if (!workerUrlMatch) {
      throw new Error('Could not find worker URL in deployment output');
    }

    return workerUrlMatch[0].trim();
  } catch (error) {
    console.error(chalk.red('\n❌ Server deployment failed:'));
    console.error(error.message);
    process.exit(1);
  }
}

// Function to build the embeddable script
async function buildEmbed(serverUrl) {
  return build({
    mode: 'production',
    configFile: false,
    define: {
      'process.env': JSON.stringify(''),
      'process.env.NODE_ENV': JSON.stringify('production'),
      '__BACKEND_SERVER_URL__': JSON.stringify(serverUrl)
    },
    plugins: [
      react({
        jsxRuntime: 'classic',
        development: false,
      }),
      tailwindcss()
    ],
    build: {
      lib: {
        entry: join(process.cwd(), 'deploy/OutspeedAgentEmbed/embed.tsx'),
        name: 'OutspeedAgentEmbed',
        fileName: 'outspeed-agent-embed',
        formats: ['iife'],
      },
      rollupOptions: {
        external: ['react', 'react-dom'],
        output: {
          globals: {
            'react': 'React',
            'react-dom': 'ReactDOM'
          }
        }
      },
      outDir: '.outspeed',
      emptyOutDir: false,
      minify: true,
      sourcemap: false,
    },
    envPrefix: "OUTSPEED_",
    resolve: {
      alias: {
        '@': join(process.cwd(), 'src/client'),
        '@src': join(process.cwd(), 'src'),
      },
    },
  });
}

// Function to deploy static assets
async function deployAssets(workerUrl) {
  console.log(chalk.cyan('\n📦 Deploying static assets...'));
  
  try {
    const deployCommand = [
      'npx wrangler deploy',
      '--assets=.outspeed',
      `--var OPENAI_API_KEY:${process.env.OPENAI_API_KEY}`,
      `--var OUTSPEED_API_KEY:${process.env.OUTSPEED_API_KEY}`
    ].join(' ');

    execSync(deployCommand, { stdio: 'inherit' });
  } catch (error) {
    console.error(chalk.red('\n❌ Static assets deployment failed:'));
    console.error(error.message);
    process.exit(1);
  }
}

// Main deployment process
async function main() {
  // Check environment variables from .env
  const envPath = join(process.cwd(), '.env');
  const envContent = readFileSync(envPath, 'utf-8');
  const envVars = {
    OPENAI_API_KEY: envContent.includes('OPENAI_API_KEY') && !!process.env.OPENAI_API_KEY,
    OUTSPEED_API_KEY: envContent.includes('OUTSPEED_API_KEY') && !!process.env.OUTSPEED_API_KEY
  };

  if (!envVars.OPENAI_API_KEY || !envVars.OUTSPEED_API_KEY) {
    console.log(chalk.yellow('\n⚠️  Warning: Required environment variables are missing in .env'));
    process.exit(1);
  }

  // Check if logged into Cloudflare
  try {
    execSync('npx wrangler whoami', { stdio: 'ignore' });
  } catch (error) {
    console.log(chalk.yellow('\n🔑 Not logged into Cloudflare. Opening browser for login...'));
    try {
      execSync('npx wrangler login', { stdio: 'inherit' });
    } catch (loginError) {
      console.error(chalk.red('\n❌ Failed to complete Cloudflare login. Please try again.'));
      process.exit(1);
    }
  }

  // Step 1: Deploy server and get worker URL
  const workerUrl = await deployServer();
  console.log(chalk.green('\n✨ Server deployed successfully!'));
  console.log(chalk.blue(`Worker URL: ${workerUrl}`));

  // Step 2: Build the embeddable version with server URL
  console.log(chalk.cyan('\n🔨 Building embeddable script...'));
  try {
    await buildEmbed(workerUrl);
    console.log(chalk.green('✓ Embeddable script built successfully'));
  } catch (error) {
    console.error(chalk.red('\n❌ Failed to build embeddable script:'));
    console.error(error.message);
    process.exit(1);
  }

  // Step 3: Deploy static assets
  await deployAssets(workerUrl);

  // Print final embed script information
  console.log(chalk.dim('┌─────────────────────────────────────────────────────────────┐'));
  console.log(chalk.dim('│                    Deployment complete                      │'));
  console.log(chalk.dim('└─────────────────────────────────────────────────────────────┘'));
  
  console.log(chalk.cyan('\n📜 Embed script:'));
  console.log(chalk.blue(`<script src="${workerUrl}/outspeed-agent-embed.iife.js"></script>`));
  console.log(chalk.blue(`<script>window.OutspeedAgentEmbed.init();</script>`));
}

// Run the deployment process
main().catch(error => {
  console.error(chalk.red('\n❌ Deployment process failed:'));
  console.error(error.message);
  process.exit(1);
}); 