import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

import { PUBLISH_ORDER } from './packages.mjs';

const REQUIRED_FILES = ['package.json', 'README.md', 'LICENSE'];
const ASSET = /\.(css|prisma)$/;
const FORBIDDEN = /^(src|node_modules)\/|\.tsbuildinfo$|^tsconfig\.json$/;

const run = (command, args) =>
  execFileSync(command, args, { encoding: 'utf8', stdio: 'pipe' });

const failures = [];

for (const name of PUBLISH_ORDER) {
  const dir = `packages/${name}`;
  const manifest = JSON.parse(readFileSync(`${dir}/package.json`, 'utf8'));
  console.log(`\n${manifest.name}@${manifest.version}`);

  try {
    run('npx', ['publint', dir, '--strict']);
    console.log('  publint: ok');
  } catch (error) {
    failures.push(`${manifest.name}: publint\n${error.stdout ?? error}`);
  }

  const assets = Object.keys(manifest.exports).filter(entry =>
    ASSET.test(entry)
  );
  try {
    run('npx', [
      'attw',
      '--pack',
      dir,
      '--profile',
      'esm-only',
      ...(assets.length ? ['--exclude-entrypoints', ...assets] : []),
    ]);
    console.log('  attw: ok');
  } catch (error) {
    failures.push(`${manifest.name}: attw\n${error.stdout ?? error}`);
  }

  const [pack] = JSON.parse(
    run('npm', ['pack', '--dry-run', '--json', '--ignore-scripts', '-w', dir])
  );
  const files = pack.files.map(file => file.path);
  const missing = REQUIRED_FILES.filter(file => !files.includes(file));
  const forbidden = files.filter(file => FORBIDDEN.test(file));
  const unpublished = Object.entries(manifest.dependencies ?? {}).filter(
    ([dep, range]) => dep.startsWith('@mysamyr/') && range !== manifest.version
  );
  if (missing.length) failures.push(`${manifest.name}: missing ${missing}`);
  if (forbidden.length)
    failures.push(`${manifest.name}: includes ${forbidden}`);
  if (unpublished.length) {
    failures.push(
      `${manifest.name}: internal dependency versions differ: ${unpublished.map(([dep, range]) => `${dep}@${range}`)}`
    );
  }
  console.log(`  tarball: ${files.length} files, ${pack.size} bytes`);
}

if (failures.length) {
  console.error(`\n${failures.join('\n\n')}`);
  process.exit(1);
}
console.log('\nAll packages are ready to publish.');
