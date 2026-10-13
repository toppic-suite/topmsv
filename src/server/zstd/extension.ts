// The sqlite-zstd extension (github.com/phiresky/sqlite-zstd, release
// v0.3.5): transparent zstd compression of BLOB / TEXT columns with one
// dictionary per column; a compressed table becomes a view that
// decompresses on read, so every connection that reads a compressed file
// loads the extension first (toppic_test experiment 171). It needs SQLite
// >= 3.49.1; node:sqlite of Node 24 has 3.53.

import * as fs from 'fs';
import * as path from 'path';
import { DatabaseSync } from 'node:sqlite';

const ROOT = path.join(__dirname, '..', '..', '..');

/** The library file name of the extension on this platform. */
export function extensionFileName(): string {
  if (process.platform === 'win32') return 'sqlite_zstd.dll';
  if (process.platform === 'darwin') return 'libsqlite_zstd.dylib';
  return 'libsqlite_zstd.so';
}

/** Where `npm run fetch-sqlite-zstd` puts the extension. */
export const DEFAULT_EXTENSION_DIR = path.join(ROOT, 'ext', 'sqlite_zstd');

/**
 * The path of the extension: the environment variable SQLITE_ZSTD_EXTENSION,
 * else ext/sqlite_zstd/<library> of the repository; null when neither exists.
 */
export function zstdExtensionPath(): string | null {
  const env = process.env.SQLITE_ZSTD_EXTENSION;
  if (env) return fs.existsSync(env) ? env : null;
  const p = path.join(DEFAULT_EXTENSION_DIR, extensionFileName());
  return fs.existsSync(p) ? p : null;
}

export interface LoadOptions {
  logLevel?: string;           // SQLITE_ZSTD_LOG unless set, default warn
  need?: string;               // what needs the extension, for the error message
}

/**
 * Load the extension into a connection opened with allowExtension; throws an
 * Error that says how to get it when it is not available. The extension
 * logs at the level of the environment variable SQLITE_ZSTD_LOG, info by
 * default (a line per load); warn keeps it out of the server log unless set
 * otherwise. (The level is read once, at the first load.)
 */
export function loadZstdExtension(db: DatabaseSync, opts: LoadOptions = {}): void {
  const ext = zstdExtensionPath();
  if (!ext) {
    const env = process.env.SQLITE_ZSTD_EXTENSION;
    const fix = env
      ? `SQLITE_ZSTD_EXTENSION names no file (${env})`
      : `run "npm run fetch-sqlite-zstd" or set SQLITE_ZSTD_EXTENSION to its library file (${extensionFileName()})`;
    throw new Error(`${opts.need ?? 'the file is compressed with sqlite-zstd'}, and the sqlite-zstd extension `
      + `is not available: ${fix}`);
  }
  const logLevel = opts.logLevel ?? 'warn';
  process.env.SQLITE_ZSTD_LOG ??= logLevel;
  db.loadExtension(ext);
  // no further loading: an uploaded file's views or triggers must not reach
  // SQL's load_extension()
  db.enableLoadExtension(false);
}

/** Whether a sqlite file holds sqlite-zstd's tables (opened without the extension). */
export function isZstdFile(sqlitePath: string): boolean {
  const db = new DatabaseSync(sqlitePath, { readOnly: true });
  try {
    return db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = '_zstd_configs'").get() !== undefined;
  } finally {
    db.close();
  }
}
