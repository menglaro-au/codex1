# Droplet Web Test

A tiny Node.js server with a health endpoint and a static page to verify your droplet is serving traffic.

## Run (Node.js)

- Prereq: Node 16+ on the droplet
- Start: `PORT=8080 node webtest/server.js`
- Visit: `http://<droplet-ip>:8080/`
- Health: `curl -s http://<droplet-ip>:8080/healthz`

To bind to port 80 directly: `sudo PORT=80 node webtest/server.js` (or use a reverse proxy like Nginx).

## Run (Docker)

- Build: `docker build -t webtest ./webtest`
- Run: `docker run -d --name webtest -p 80:8080 webtest`
- Visit: `http://<droplet-ip>/`
- Health: `curl -s http://<droplet-ip>/healthz`

## Endpoints

- `/` – Static status page with server info
- `/healthz` – Returns `{ "status": "ok" }`
- `/api/info` – Returns JSON with hostname, time, Node version, and IPs

## systemd (optional)

Create `/etc/systemd/system/webtest.service`:

```
[Unit]
Description=WebTest Droplet App
After=network.target

[Service]
Environment=PORT=8080
WorkingDirectory=/opt/codex1/webtest
ExecStart=/usr/bin/node server.js
Restart=always
User=www-data
Group=www-data

[Install]
WantedBy=multi-user.target
```

Then:

```
sudo mkdir -p /opt/codex1
sudo cp -r webtest /opt/codex1/
sudo systemctl daemon-reload
sudo systemctl enable --now webtest
```

## Quick Verify

- Page: `curl -sI http://<droplet-ip>/ | head -n1`
- Health: `curl -s http://<droplet-ip>/healthz`
- Info: `curl -s http://<droplet-ip>/api/info | jq`

```json
{"status":"ok"}
```
