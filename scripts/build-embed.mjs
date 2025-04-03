#!/usr/bin/env node
import { join } from 'path';
import { build } from 'vite';

async function buildEmbed() {
  try {
    await build({
      configFile: false, // don't use vite.config.ts
      build: {
        lib: {
          entry: join(process.cwd(), 'src/client/components/FloatingTalkButton/embed.tsx'),
          name: 'FloatingTalkButton',
          fileName: 'floating-talk-button',
          formats: ['iife'],
        },
        outDir: '.outspeed',
        emptyOutDir: false,
        rollupOptions: {
            external: ['react', 'react-dom'],
            output: {
              globals: {
                'react': 'React',
                'react-dom': 'ReactDOM'
              }
            }
          }
      },
      resolve: {
        alias: {
          '@': join(process.cwd(), 'src/client'),
          '@src': join(process.cwd(), 'src'),
        },
      },
    });

    console.log('✅ Embed script built successfully');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

buildEmbed(); 