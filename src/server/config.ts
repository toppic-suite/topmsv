// Server options set from the command line (see server.ts), read by the
// routes and reported to the home page through /api/config.

export const serverConfig = {
  /** true when started with --view-only: the upload panel and the Delete
   *  buttons are hidden, and POST/DELETE /api/datasets are refused. */
  viewOnly: false,
};

/** Apply the recognized command-line flags; returns the unknown ones. */
export function applyCommandLine(args: string[]): string[] {
  const unknown: string[] = [];
  for (const arg of args) {
    if (arg === '--view-only') {
      serverConfig.viewOnly = true;
    } else {
      unknown.push(arg);
    }
  }
  return unknown;
}
