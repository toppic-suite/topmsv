#!/usr/bin/env bash
# Start the TopMSV server on Linux / macOS.
#
#   ./start_server.sh                 start at http://localhost:3000
#   ./start_server.sh --view-only     read-only server (no upload / delete)
#
# Set PORT and DATA_DIR to change the port or the dataset directory, e.g.:
#   PORT=8080 DATA_DIR=/data/topmsv ./start_server.sh
#
# Every run installs the dependencies, builds the browser scripts and then
# starts the server. Requires Node.js 24 or newer (https://nodejs.org);
# a bundled copy in the "node" folder next to this script is used when
# present.

set -euo pipefail
cd "$(dirname "$0")"

# Use the bundled Node.js in the "node" folder if it exists.
if [ -d node/bin ]; then
  export PATH="$PWD/node/bin:$PATH"
elif [ -d node ]; then
  export PATH="$PWD/node:$PATH"
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js was not found. Install Node.js 24 or newer from https://nodejs.org and try again." >&2
  exit 1
fi

echo "Installing dependencies..."
npm install

echo "Building the browser scripts..."
npm run build:client

PORT="${PORT:-3000}"
export PORT
echo "Starting TopMSV at http://localhost:$PORT (press Ctrl+C to stop)"
exec npm start -- "$@"
