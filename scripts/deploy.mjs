#!/usr/bin/env node

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import chalk from "chalk";
import { config } from "dotenv";
import figlet from "figlet";
import pty from "node-pty";
import { build } from "vite";

// Load environment variables
config();

// Debug environment variables
console.log(chalk.dim("\nEnvironment Variables:"));
console.log(
  chalk.dim("OPENAI_API_KEY:"),
  process.env.OPENAI_API_KEY
    ? `${process.env.OPENAI_API_KEY.slice(0, 3)}...${process.env.OPENAI_API_KEY.slice(-4)}`
    : "Not set",
);
console.log(
  chalk.dim("OUTSPEED_API_KEY:"),
  process.env.OUTSPEED_API_KEY
    ? `${process.env.OUTSPEED_API_KEY.slice(0, 3)}...${process.env.OUTSPEED_API_KEY.slice(-4)}`
    : "Not set",
);

// Pretty print Outspeed
console.log(
  chalk.blue(
    figlet.textSync("Outspeed", {
      font: "Standard",
      horizontalLayout: "default",
      verticalLayout: "default",
    }),
  ),
);

/**
 * Runs a command in a pseudo-terminal and returns the output.
 *
 * @param {string} command - The command to run
 * @param {string[]} args - The arguments to pass to the command
 * @returns {Promise<string>} The output of the command
 */
async function runInteractiveCommand(command, args) {
  return new Promise((resolve, reject) => {
    let listener;
    const cleanup = () => {
      process.stdin.setRawMode(false);
      if (listener) {
        console.log("Removing listener");
        process.stdin.removeListener("data", listener);
      }
    };

    try {
      const outputChunks = [];

      // spawn the process in a pseudo-terminal to deploy the worker
      const ptyProcess = pty.spawn(command, args, {
        name: "xterm-color",
        cols: 80,
        rows: 30,
        cwd: process.cwd(),
        env: process.env,
      });

      // Turning on raw mode so that when we press special keys like
      // arrow keys, they work in pseudo-terminal as well
      // DON'T TURN IT OFF OR YOU WILL NOT BE ABLE TO USE ARROW KEYS,
      // WHICH MIGHT BE REQUIRED ON FIRST LOGIN TO CLOUDFLARE
      process.stdin.setRawMode(true);
      listener = (data) => {
        // forwarding input to the pty process
        ptyProcess.write(data);
      };

      process.stdin.on("data", listener);

      // capture output while also showing it in the terminal
      ptyProcess.onData((data) => {
        process.stdout.write(data);
        outputChunks.push(data.toString());
      });

      ptyProcess.onExit(({ exitCode }) => {
        cleanup();
        if (exitCode !== 0) {
          reject(new Error(`Process exited with code ${exitCode}`));
          return;
        }

        resolve(outputChunks.join(""));
      });

      ptyProcess.on("error", (error) => {
        cleanup();
        reject(error);
      });
    } catch (error) {
      cleanup();
      reject(error);
    }
  });
}

// Function to deploy server to Cloudflare Workers
async function deployServer() {
  console.log(chalk.cyan("\n🚀 Deploying server to Cloudflare Workers..."));

  try {
    console.log(chalk.dim("┌─────────────────────────────────────────────────────────────┐"));
    console.log(chalk.dim("│                     Deployment started                      │"));
    console.log(chalk.dim("└─────────────────────────────────────────────────────────────┘"));

    // First deploy to get the URL
    const command = "npx";
    const args = [
      "wrangler",
      "deploy",
      "--var",
      `OPENAI_API_KEY:${process.env.OPENAI_API_KEY}`,
      "--var",
      `OUTSPEED_API_KEY:${process.env.OUTSPEED_API_KEY}`,
    ];
    const deployOutput = await runInteractiveCommand(command, args);

    // Extract the worker URL from the output
    const workerUrlMatch = deployOutput.match(/\bhttps?:\/\/[a-z-.]*\.workers\.dev/g);
    if (!workerUrlMatch) {
      throw new Error("Could not find worker URL in deployment output");
    }

    return workerUrlMatch[0].trim();
  } catch (error) {
    console.error(chalk.red("\n❌ Server deployment failed:"));
    console.error(error.message);
    process.exit(1);
  }
}

// Function to build the embeddable script
async function buildEmbed(serverUrl) {
  return build({
    mode: "production",
    configFile: false,
    define: {
      "process.env": JSON.stringify(""),
      "process.env.NODE_ENV": JSON.stringify("production"),
      __BACKEND_SERVER_URL__: JSON.stringify(serverUrl),
    },
    plugins: [
      react({
        jsxRuntime: "classic",
        development: false,
      }),
      tailwindcss(),
    ],
    build: {
      lib: {
        entry: path.join(process.cwd(), "deploy/OutspeedAgentEmbed/embed.tsx"),
        name: "OutspeedAgentEmbed",
        fileName: "outspeed-agent-embed",
        formats: ["iife"],
      },
      rollupOptions: {
        external: ["react", "react-dom"],
        output: {
          globals: {
            react: "React",
            "react-dom": "ReactDOM",
          },
        },
      },
      outDir: ".outspeed",
      emptyOutDir: false,
      minify: true,
      sourcemap: false,
    },
    envPrefix: "OUTSPEED_",
    resolve: {
      alias: {
        "@": path.join(process.cwd(), "src/client"),
        "@src": path.join(process.cwd(), "src"),
      },
    },
  });
}

// Function to deploy static assets
async function deployAssets(workerUrl) {
  console.log(chalk.cyan("\n📦 Deploying static assets..."));

  try {
    const deployCommand = [
      "npx wrangler deploy",

      "--assets=.outspeed",
      `--var OPENAI_API_KEY:${process.env.OPENAI_API_KEY}`,
      `--var OUTSPEED_API_KEY:${process.env.OUTSPEED_API_KEY}`,
    ].join(" ");

    execSync(deployCommand, { stdio: "inherit" });
  } catch (error) {
    console.error(chalk.red("\n❌ Static assets deployment failed:"));
    console.error(error.message);
    process.exit(1);
  }
}

// Main deployment process
async function main() {
  // Check environment variables from .env
  const envPath = path.join(process.cwd(), ".env");
  const envContent = fs.readFileSync(envPath, "utf-8");
  const envVars = {
    OPENAI_API_KEY: envContent.includes("OPENAI_API_KEY") && !!process.env.OPENAI_API_KEY,
    OUTSPEED_API_KEY: envContent.includes("OUTSPEED_API_KEY") && !!process.env.OUTSPEED_API_KEY,
  };

  if (!envVars.OPENAI_API_KEY || !envVars.OUTSPEED_API_KEY) {
    console.log(chalk.yellow("\n⚠️  Warning: Required environment variables are missing in .env"));
    process.exit(1);
  }

  // Check if logged into Cloudflare
  try {
    execSync("npx wrangler whoami", { stdio: "inherit" });
  } catch (error) {
    console.log(chalk.yellow("\n🔑 Not logged into Cloudflare. Opening browser for login..."));
    try {
      execSync("npx wrangler login", { stdio: "inherit" });
    } catch (loginError) {
      console.error(chalk.red("\n❌ Failed to complete Cloudflare login. Please try again."));
      process.exit(1);
    }
  }

  // Step 1: Deploy server and get worker URL
  const workerUrl = await deployServer();
  console.log(chalk.green("\n✨ Server deployed successfully!"));
  console.log(chalk.blue(`Worker URL: ${workerUrl}`));

  // Step 2: Build the embeddable version with server URL
  console.log(chalk.cyan("\n🔨 Building embeddable script..."));
  try {
    await buildEmbed(workerUrl);
    console.log(chalk.green("✓ Embeddable script built successfully"));
  } catch (error) {
    console.error(chalk.red("\n❌ Failed to build embeddable script:"));
    console.error(error.message);
    process.exit(1);
  }

  // Step 3: Deploy static assets
  await deployAssets(workerUrl);

  // Print final embed script information
  console.log(chalk.dim("┌─────────────────────────────────────────────────────────────┐"));
  console.log(chalk.dim("│                    Deployment complete                      │"));
  console.log(chalk.dim("└─────────────────────────────────────────────────────────────┘"));

  console.log(chalk.cyan("\n💻 Worker URL:"));
  console.log(chalk.blue(`${workerUrl}`));

  console.log(chalk.cyan("\n📜 Embed scripts:"));
  console.log(chalk.yellow("// JavaScript - Load the Outspeed Agent script"));
  console.log(chalk.blue(`<script src="${workerUrl}/outspeed-agent-embed.iife.js"></script>`));

  console.log(chalk.yellow("\n// Styling - Load the Outspeed Agent CSS"));
  console.log(chalk.blue(`<link rel="stylesheet" href="${workerUrl}/outspeed-agent-embed.css">`));

  console.log(chalk.yellow("\n// JavaScript - Initialize the Outspeed Agent"));
  console.log(chalk.blue(`<script>window.OutspeedAgentEmbed.init();</script>`));
}

// Run the deployment process
main()
  .then(() => {
    console.log(chalk.green("\n✅ Deployment process completed successfully"));
    // after fucking with process.stdin in runInteractiveCommand, the command isn't exiting
    // i wasted some time on this but could not fix it. hence i'm manually exiting with status code 0
    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red("\n❌ Deployment process failed:"));
    console.error(error.message);
    process.exit(1);
  });
