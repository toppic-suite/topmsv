// Application version, read once from package.json (the single place the
// version is set); served at /api/version and shown on the home page.

import * as fs from 'fs';
import * as path from 'path';

function readVersion(): string {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf8'));
    return typeof pkg.version === 'string' ? pkg.version : 'unknown';
  } catch {
    return 'unknown';
  }
}

export const APP_VERSION: string = readVersion();
