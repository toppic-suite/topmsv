// Application version, read once from package.json (the single place the
// version is set); the full four-part version is logged at startup, the
// three-part display version is served by /api/config and shown on the pages.

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

// Full version as written in package.json, e.g. "1.9.0.0".
export const APP_VERSION: string = readVersion();

// The version shown in the web pages: only the first three components
// ("1.9.0.0" -> "1.9.0"); a version with fewer parts is shown unchanged.
export const APP_DISPLAY_VERSION: string = APP_VERSION.split('.').slice(0, 3).join('.');
