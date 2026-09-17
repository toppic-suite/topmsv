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

## Configure nginx

nginx from the nginx.org packages loads `/etc/nginx/conf.d/*.conf` and has
no `sites-available`; create `/etc/nginx/conf.d/topmsv.conf` there (with a
distribution package, put the same block in
`/etc/nginx/sites-available/topmsv` and symlink it into `sites-enabled`).
`server_name` is the host name the server is reached under (the DNS record
for it is set up in the HTTPS section); `_` matches any name while there
is none yet:

```nginx
server {
    listen 80;
    server_name topmsv.toppic.org;

    # Uploaded sqlite files are large. nginx's default client_max_body_size
    # is 1 MB; anything bigger is refused with "413 Request Entity Too
    # Large" before the request reaches the app, and the home page then
    # shows "upload failed: HTTP 413". 0 disables the limit; a size such
    # as 4G caps it.
    client_max_body_size 0;

    # Validating and indexing an upload can take minutes on a big file.
    proxy_read_timeout 600s;
    proxy_send_timeout 600s;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Remove or rename the package's own `default.conf` in the same directory
if it also listens on port 80 with `server_name _`, then check the
configuration and reload nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

To see which file holds an existing block: `sudo nginx -T` prints the
whole configuration with `# configuration file ...` headers.

Verify that a large upload is accepted by nginx (an invalid file must be
rejected by the app with a JSON error, not by nginx with an HTML page):

```bash
head -c 2000000 /dev/zero > big.bin
curl -s -X POST http://localhost/api/datasets -F "file=@big.bin" -w "\nHTTP %{http_code}\n"
rm big.bin
```

The answer must be JSON from the app (e.g. `{"error":...}` with HTTP 400),
not `<html>...413 Request Entity Too Large...` from nginx.

Notes:

- `client_max_body_size` must be set in the `server` (or `http`) block or
  in the `location /` block that proxies to the app; a value set in an
  unrelated `location` block has no effect on `/api/datasets`.
- Before the fix in commit 8198f95 the home page reported nginx's 413 page
  as `Unexpected token '<', "<html> <h"... is not valid JSON`; that
  message on an older build means the same thing.

## Enable HTTPS

The certificate comes from Let's Encrypt through certbot, which needs a
domain name that resolves to the server — it does not issue certificates
for a bare IP address. TopMSV is reached as `topmsv.toppic.org`; the
`toppic.org` web site is a different server (its own nginx on another
instance) and is not touched.

In the Lightsail console:

- Networking: create a static IP and attach it to the instance, so the
  address survives stop/start.
- Instance -> Networking -> IPv4 Firewall: add HTTPS (TCP 443) next to
  HTTP (TCP 80); port 80 stays open, certbot validates the domain over it
  and it carries the redirect to HTTPS.

Where the `toppic.org` DNS zone is managed, add an A record for
`topmsv.toppic.org` pointing at the static IP, and wait until it resolves:

```bash
dig +short topmsv.toppic.org      # must print the static IP
```

On the server, with `server_name topmsv.toppic.org;` in the nginx block
above, install certbot and let it obtain the certificate and rewrite that
block (answer "redirect" when it asks whether to redirect HTTP to HTTPS):

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d topmsv.toppic.org
```

certbot adds a `listen 443 ssl` server with the certificate paths to
`/etc/nginx/conf.d/topmsv.conf` and turns the port-80 server into a
redirect; `client_max_body_size` and the proxy settings stay in place.
Check the result and the automatic renewal (a `certbot.timer` systemd
unit renews the certificate before it expires):

```bash
curl -I https://topmsv.toppic.org
sudo certbot renew --dry-run
```

Notes:

- certbot matches the block to edit by `server_name`; if it reports that
  it cannot find a matching block, the name is missing or spelled
  differently in the nginx configuration.
- The `toppic.org` site keeps plain HTTP; giving it a certificate would be
  the same certbot command run on its own server.

