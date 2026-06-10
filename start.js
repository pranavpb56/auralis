#!/usr/bin/env node
/**
 * Auralis Dev Launcher
 * Starts backend (port 4000) and frontend (port 3000) together.
 * Run: node start.js
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const isWindows = process.platform === 'win32';
const npm = isWindows ? 'npm.cmd' : 'npm';

// Check .env exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('\n❌  .env file not found!');
  console.error('   Run this first:');
  console.error(isWindows ? '   copy .env.example .env' : '   cp .env.example .env');
  console.error('   Then add your GROQ_API_KEY to .env\n');
  process.exit(1);
}

// Check frontend .env.local
const feEnvPath = path.join(__dirname, 'frontend', '.env.local');
if (!fs.existsSync(feEnvPath)) {
  fs.writeFileSync(feEnvPath, 'NEXT_PUBLIC_API_URL=http://localhost:4000/api\n');
  console.log('✅  Created frontend/.env.local');
}

// Copy backend .env
const beEnvPath = path.join(__dirname, 'backend', '.env');
if (!fs.existsSync(beEnvPath)) {
  fs.copyFileSync(envPath, beEnvPath);
  console.log('✅  Copied .env to backend/.env');
}

console.log('\n🎵  Starting Auralis...\n');

function startProcess(name, cwd, args, color) {
  const proc = spawn(npm, args, {
    cwd: path.join(__dirname, cwd),
    shell: true,
    stdio: 'pipe',
    env: { ...process.env }
  });

  const prefix = color + `[${name}]` + '\x1b[0m ';

  proc.stdout.on('data', d => process.stdout.write(prefix + d.toString().replace(/\n/g, '\n' + prefix).trimEnd() + '\n'));
  proc.stderr.on('data', d => process.stderr.write(prefix + d.toString().replace(/\n/g, '\n' + prefix).trimEnd() + '\n'));
  proc.on('exit', code => { if (code !== 0 && code !== null) console.log(`${prefix}exited with code ${code}`); });

  return proc;
}

const backend  = startProcess('backend ', 'backend',  ['run', 'dev'],  '\x1b[35m'); // purple
const frontend = startProcess('frontend', 'frontend', ['run', 'dev'],  '\x1b[36m'); // cyan

console.log('   Backend  → http://localhost:4000');
console.log('   Frontend → http://localhost:3000\n');
console.log('   Press Ctrl+C to stop both servers\n');

process.on('SIGINT', () => {
  backend.kill();
  frontend.kill();
  process.exit(0);
});
