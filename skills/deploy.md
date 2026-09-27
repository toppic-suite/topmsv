# Deploy behind nginx on a Linux server

Run TopMSV on a Linux server (e.g. an EC2 instance) with nginx as the
reverse proxy in front of the Node.js server. The app listens on
`localhost:3000`; nginx serves port 80 and forwards every request to it.
The commands assume the repository is checked out in
`/home/admin/topmsv_private` and that `nginx` is installed.

## Install the app

```bash
cd /home/admin/topmsv_private
git pull
npm install
npm run build:client
```

Re-run `npm run build:client` and restart the service after every
`git pull`: the browser scripts are generated and not checked in.

## Run the app as a systemd service

The service keeps the server running in the background, restarts it when
it crashes and starts it at boot. Create `/etc/systemd/system/topmsv.service`:

```ini
[Unit]
Description=TopMSV server
After=network.target

[Service]
User=admin
WorkingDirectory=/home/admin/topmsv_private
Environment=PORT=3000
Environment=PATH=/home/admin/.nvm/versions/node/v24.21.0/bin:/usr/local/bin:/usr/bin:/bin
ExecStart=/home/admin/.nvm/versions/node/v24.21.0/bin/npm start
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

systemd does not read the user's shell profile, so the Node.js `bin`
directory must be given explicitly: `ExecStart` needs the absolute path of
`npm`, and `PATH` must contain the same directory because `npm start` runs
`ts-node`, whose `#!/usr/bin/env node` line looks `node` up on the PATH
(without it the service dies at once with `/usr/bin/env: 'node': No such
file or directory`, exit status 127). Replace
`/home/admin/.nvm/versions/node/v24.21.0/bin` in both lines with the
output of `dirname "$(which node)"` on the server; with Node.js installed
from a distribution package it is `/usr/bin`. To share datasets read-only,
append `-- --view-only` to `ExecStart` (the upload panel and Delete
buttons are hidden, uploads and deletions are refused).

Start the service now and at every boot, and check it is running:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now topmsv
sudo systemctl status topmsv
```

Day-to-day commands:

```bash
sudo journalctl -u topmsv -f        # follow the server log
sudo systemctl restart topmsv       # after git pull + npm run build:client
sudo systemctl stop topmsv
```

## Set up nginx and HTTPS

Put nginx in front of the service and enable HTTPS as described in
`nginx.md`: the server block with the upload size limit and proxy
timeouts, the Let's Encrypt certificate, and the fix for
"upload failed: HTTP 413".
