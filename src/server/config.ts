// Server options set from the command line (see server.ts), read by the
// routes and reported to the home page through /api/config.

export const serverConfig = {
  /** false when started with disable-upload: the upload panel is hidden
   *  and POST /api/datasets is refused. */
  uploadEnabled: true,
};

/** Apply the recognized command-line flags; returns the unknown ones. */
export function applyCommandLine(args: string[]): string[] {
  const unknown: string[] = [];
  for (const arg of args) {
    if (arg === 'disable-upload') {
      serverConfig.uploadEnabled = false;
    } else {
      unknown.push(arg);
    }
  }
  return unknown;
}
