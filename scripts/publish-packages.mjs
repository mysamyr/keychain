import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

import { PUBLISH_ORDER } from './packages.mjs';

const run = (args, stdio = 'inherit') =>
  execFileSync('npm', args, { encoding: 'utf8', stdio });

function isPublished(name, version) {
  try {
    return run(['view', `${name}@${version}`, 'version'], 'pipe').trim() !== '';
  } catch {
    return false;
  }
}

for (const name of PUBLISH_ORDER) {
  const dir = `packages/${name}`;
  const { name: pkg, version } = JSON.parse(
    readFileSync(`${dir}/package.json`, 'utf8')
  );
  if (isPublished(pkg, version)) {
    console.log(`${pkg}@${version} is already published`);
    continue;
  }
  const tag = version.includes('-')
    ? version.split('-')[1].split('.')[0]
    : 'latest';
  console.log(`Publishing ${pkg}@${version} with tag ${tag}`);
  run(['publish', '-w', dir, '--tag', tag]);
}
