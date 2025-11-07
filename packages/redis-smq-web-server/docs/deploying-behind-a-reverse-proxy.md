[RedisSMQ Web Server](../README.md) / Deploying behind a reverse proxy

# Deploying behind a reverse proxy

## Scenario 1: Without basePath (Hosted on a Subdomain)

**Goal**: A user goes to `https://smq.example.com`, and the proxy forwards the request to the Node.js app running on
`http://localhost:7210`.

**1. Application Config (`redis-smq.json` or equivalent):** The `basePath` should be `/`.

```json
{
  "webServer": {
    "basePath": "/"
  }
}
```

**2. Reverse Proxy Config (Example: Nginx):** The proxy passes the request to the backend and adds the necessary
`X-Forwarded-*` headers.

```text
server {
    listen 443 ssl;
    server_name smq.example.com;

    # SSL configuration...
    # ssl_certificate /path/to/cert.pem;
    # ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:7210;

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Required for WebSocket support (for API proxying)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

**How it works:**

- A request to `https://smq.example.com/assets/main.js` is received by Nginx.
- Nginx forwards it to `http://localhost:7210/assets/main.js`.
- The Express app receives the request and serves the file `/assets/main.js`.

## Scenario 2: With basePath (Hosted in a Sub-directory)

**Goal:** A user goes to `https://example.com/smq`, and the proxy forwards the request to the Node.js app
on `http://localhost:7210`.

**1. Application Config (redis-smq.json or equivalent):** The `basePath` must match the sub-directory.

```json
{
  "webServer": {
    "basePath": "/smq"
  }
}
```

**2. Reverse Proxy Config (Example: Nginx): Crucially, the proxy must not strip the `/smq` prefix from the URL when forwarding.**

```text
server {
    listen 443 ssl;
    server_name example.com;

    # ... SSL config ...

    # IMPORTANT: No trailing slash on the location or proxy_pass URL.
    # This ensures the original path is preserved.
    location /smq {
        proxy_pass http://localhost:7210;

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

**How it works:**

- A user requests `https://example.com/smq/assets/main.js`.
- Nginx receives the request and forwards it to `http://localhost:7210/smq/assets/main.js`. The `/smq` path is preserved.
- The Express app receives the request, matches the path and serves the requested file.
