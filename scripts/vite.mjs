import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const viteBinPath = path.join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js');
const localWindowsEsbuildPath = path.join(
  rootDir,
  'node_modules',
  '@esbuild',
  'win32-x64',
  'esbuild.exe'
);
const rollupNativePath = path.join(rootDir, 'node_modules', 'rollup', 'dist', 'native.js');
const rollupWasmNativePath = path.join(rootDir, 'node_modules', '@rollup', 'wasm-node', 'dist', 'native.js');
const rollupWasmBindingsDir = path.join(rootDir, 'node_modules', '@rollup', 'wasm-node', 'dist', 'wasm-node');
const rollupBindingsTargetDir = path.join(rootDir, 'node_modules', 'rollup', 'dist', 'wasm-node');

const copyWindowsEsbuildToTemp = () => {
  if (process.platform !== 'win32') return '';
  if (!fs.existsSync(localWindowsEsbuildPath)) return '';

  const tempDir = path.join(os.tmpdir(), 'finally-storage-tools');
  const tempEsbuildPath = path.join(tempDir, 'esbuild.exe');

  fs.mkdirSync(tempDir, { recursive: true });
  fs.copyFileSync(localWindowsEsbuildPath, tempEsbuildPath);

  return tempEsbuildPath;
};

const applyRollupWasmFallback = () => {
  if (process.platform !== 'win32') return;
  if (!fs.existsSync(rollupNativePath)) return;
  if (!fs.existsSync(rollupWasmNativePath)) return;
  if (!fs.existsSync(rollupWasmBindingsDir)) return;

  fs.mkdirSync(rollupBindingsTargetDir, { recursive: true });
  fs.copyFileSync(rollupWasmNativePath, rollupNativePath);

  for (const fileName of fs.readdirSync(rollupWasmBindingsDir)) {
    const sourcePath = path.join(rollupWasmBindingsDir, fileName);
    const targetPath = path.join(rollupBindingsTargetDir, fileName);
    fs.copyFileSync(sourcePath, targetPath);
  }
};

const env = { ...process.env };
const externalEsbuildPath = copyWindowsEsbuildToTemp();

if (externalEsbuildPath) {
  env.ESBUILD_BINARY_PATH = externalEsbuildPath;
}

applyRollupWasmFallback();

const child = spawn(process.execPath, [viteBinPath, ...process.argv.slice(2)], {
  cwd: rootDir,
  env,
  stdio: 'inherit'
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
