import { cp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import packageJson from './package.json' with { type: 'json' };
import tsconfigJson from './tsconfig.json' with { type: 'json' };


console.log('Building ESM modules...');
execTsc();

console.log('Preparing to build CommonJS modules...');
await forceCopy('package.json', 'package.json.bak');
await forceCopy('tsconfig.json', 'tsconfig.json.bak');

try {
  // update package.json and tsconfig.json
  await writeJson(
    'package.json',
    { ...packageJson, type: 'module' }
  );
  await writeJson(
    'tsconfig.json',
    {
      ...tsconfigJson,
      compilerOptions: { ...tsconfigJson.compilerOptions, module: 'commonjs' },
      include: ['src/**/*.cts'],
    },
  );

  // build commonjs
  await forceCopy('src/index.mts', 'src/index.cts');

  console.log('Building CommonJS modules...');
  execTsc();

} finally {
  // restore backup
  await forceCopy('package.json.bak', 'package.json', true);
  await forceCopy('tsconfig.json.bak', 'tsconfig.json', true);
  // cleanup
  await forceRemove('package.json.bak');
  await forceRemove('tsconfig.json.bak');
  await forceRemove('src/index.cts');
}



async function forceCopy(src, dest, ignoreError = false) {
  try {
    await cp(
      join(import.meta.dirname, src),
      join(import.meta.dirname, dest),
      { force: true }
    );
  } catch (error) {
    if (ignoreError) {
      console.log(`Failed to copy ${src} to ${dest} due to`, error);
    } else {
      throw error;
    }
  }
}

async function forceRemove(path) {
  try {
    await rm(join(import.meta.dirname, path), { force: true });
  } catch (error) {
    console.log(`Failed to remove ${path} due to`, error);
  }
}

async function writeJson(path, json) {
  await writeFile(
    join(import.meta.dirname, path),
    JSON.stringify(json, null, 2),
  );
}

function execTsc(args = []) {
  execFileSync(process.execPath, ['node_modules/typescript/lib/tsc.js', ...args], { stdio: 'inherit' });
}
