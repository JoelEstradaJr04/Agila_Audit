#!/usr/bin/env node
require('dotenv').config();
const { spawn } = require('child_process');

const port = process.env.PORT || 3000;

console.log(`Starting Next.js on port ${port}...`);

const child = spawn('next', ['dev', '-p', port, '--turbopack'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NODE_ENV: 'development' }
});

child.on('exit', (code) => {
  process.exit(code);
});
