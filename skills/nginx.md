# Set up nginx in front of TopMSV

Put nginx in front of the TopMSV server as the reverse proxy: nginx serves
ports 80 and 443 and forwards every request to the app on `localhost:3000`
(run as the systemd service in `deploy.md`). The uploads are large sqlite
files, so two nginx defaults must be changed: the 1 MB request body limit
and the 60-second proxy timeouts. The commands assume that `nginx` is
installed and that TopMSV is reached as `topmsv.toppic.org`.

## Configure the server block

nginx from the nginx.org packages (and Amazon Linux) loads
`/etc/nginx/conf.d/*.conf` and has no `sites-available`; create
`/etc/nginx/conf.d/topmsv.conf` there (with a Debian/Ubuntu package, put
the same block in `/etc/nginx/sites-available/topmsv` and symlink it into
`sites-enabled`). `server_name` is the host name the server is reached
under (the DNS record for it is set up in the HTTPS section); `_` matches
any name while there is none yet:

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

Keep `client_max_body_size` and the timeouts in this `server` block (or
in its `location /`) rather than in the `http` block of
`/etc/nginx/nginx.conf`: the same nginx may serve other sites, and a value
in `http` changes them all. A value set in an unrelated `location` block
has no effect on `/api/datasets`.

Remove or rename the package's own `default.conf` in the same directory
if it also listens on port 80 with `server_name _` and holds nothing else;
if other sites' `server` blocks were added to it, leave it and add the
TopMSV block next to them. Check the configuration and reload nginx — a
change has no effect until nginx is reloaded:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

To see which file holds an existing block: `sudo nginx -T` prints the
whole configuration with `# configuration file ...` headers.

## Enable HTTPS

The certificate comes from Let's Encrypt through certbot, which needs a
domain name that resolves to the server — it does not issue certificates
for a bare IP address.

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

On the server, with `server_name topmsv.toppic.org;` in the block above,
install certbot and let it obtain the certificate and rewrite that block
(answer "redirect" when it asks whether to redirect HTTP to HTTPS):

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d topmsv.toppic.org
```

certbot edits only the block whose `server_name` matches: it replaces
its `listen 80` with `listen 443 ssl` and the certificate lines, so
`client_max_body_size`, the timeouts and `location /` stay in the HTTPS
block, and it appends a second `server` block for port 80 that only
redirects to HTTPS. Check the result and the automatic renewal (a
`certbot.timer` systemd unit renews the certificate before it expires):

```bash
curl -I https://topmsv.toppic.org
sudo certbot renew --dry-run
```

If certbot reports that it cannot find a matching block, the name is
missing or spelled differently in the nginx configuration.

## Verify that large uploads get through

An invalid file must be rejected by the app with a JSON error, not by
nginx with an HTML page. Post it in the `sqlite` form field, the one the
home page uses (the app answers a file in any other field with an HTML
"MulterError: Unexpected field" page and HTTP 500):

```bash
head -c 2000000 /dev/zero > big.bin
curl -s -X POST https://topmsv.toppic.org/api/datasets -F "sqlite=@big.bin" -w "\nHTTP %{http_code}\n"
rm big.bin
```

The answer must be JSON from the app, `{"error":"the file must be a
.sqlite/.db file"}` with HTTP 400, not `<html>...413 Request Entity Too
Large...` from nginx. (Before HTTPS is enabled, post to
`http://localhost/api/datasets`.) A server started with `--view-only`
answers HTTP 403 with a JSON error instead, which also shows that the
request reached the app.

## Fix "upload failed: HTTP 413 Request Entity Too Large"

The app never answers 413 (its own limit is 4 GB and its errors are
JSON), so this message on the home page means nginx refused the upload.
nginx's error log confirms it and names the `server` block that refused
it:

```bash
sudo tail -n 5 /var/log/nginx/error.log
# ... client intended to send too large body: 569393471 bytes, ...
#     server: topmsv.toppic.org, request: "POST /api/datasets HTTP/1.1", ...
```

List where the `server` blocks and the limits are:

```bash
sudo nginx -T | grep -n -e 'configuration file' -e server_name -e client_max_body_size
```

The line numbers are positions in the `nginx -T` output, not in the file;
the file's line is the output line minus the line of its `# configuration
file` header. Print the blocks around the matching `server_name` lines
(e.g. `sudo nginx -T | sed -n '285,325p'`) to see them. After certbot
there are two blocks for `topmsv.toppic.org`: the first, with
`location /`, `proxy_pass` and `listen 443 ssl`, carries the uploads; the
second only redirects port 80. The limit must be in the first one — the
usual causes of the 413 are that it is missing there, set only in the
redirect block, or that nginx was not reloaded after the edit.

To add the settings right after the first
`server_name topmsv.toppic.org;` line (GNU sed's `0,/.../` changes only
the first match; `-i.bak` keeps a backup; use the file named by the
`# configuration file` header — below, a `default.conf` that holds all
the sites):

```bash
sudo sed -i.bak '0,/server_name topmsv\.toppic\.org;/s//&\n    client_max_body_size 0;\n    proxy_read_timeout 600s;\n    proxy_send_timeout 600s;/' /etc/nginx/conf.d/default.conf
sudo nginx -T | grep -n -A3 'server_name topmsv.toppic.org'
sudo nginx -t && sudo systemctl reload nginx
```

If `nginx -t` fails, restore the backup and reload:

```bash
sudo cp /etc/nginx/conf.d/default.conf.bak /etc/nginx/conf.d/default.conf && sudo systemctl reload nginx
```

Then repeat the upload, or the check in the previous section.

Notes:

- nginx first writes the whole upload to its client-body temp directory
  and only then passes it to the app, which writes it to `DATA_DIR`; keep
  free disk space of about three times the largest upload (`df -h`).
- Before the fix in commit 8198f95 the home page reported nginx's 413 page
  as `Unexpected token '<', "<html> <h"... is not valid JSON`; that
  message on an older build means the same thing.
