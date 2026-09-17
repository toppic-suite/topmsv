# Deploy behind nginx on a Linux server

Run TopMSV on a Linux server (e.g. an EC2 instance) with nginx as the
reverse proxy in front of the Node.js server. The app listens on
`localhost:3000`; nginx serves port 80 and forwards every request to it.
The commands assume the repository is checked out in
`/home/admin/topmsv_private` and that `nginx` is installed.

## Install and start the app

```bash
cd /home/admin/topmsv_private
git pull
npm install
npm run build:client
DATA_DIR=/home/admin/topmsv_data nohup npm start > server.log 2>&1 &
```

Re-run `npm run build:client` and restart the server after every
`git pull`: the browser scripts are generated and not checked in.

## Configure nginx

Create `/etc/nginx/sites-available/topmsv` (on distributions without
`sites-available`, put the `server` block in `/etc/nginx/conf.d/topmsv.conf`):

```nginx
server {
    listen 80;
    server_name _;

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

Enable the site, check the configuration and reload nginx:

```bash
sudo ln -sf /etc/nginx/sites-available/topmsv /etc/nginx/sites-enabled/topmsv
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

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
- To share datasets read-only, start the app with `npm start -- --view-only`
  (the upload panel and Delete buttons are hidden, uploads and deletions
  are refused).
