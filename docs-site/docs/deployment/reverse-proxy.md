---
sidebar_position: 2
title: Reverse Proxy
---

# Reverse Proxy Configuration

DeployMate includes a Caddyfile for automatic HTTPS with Caddy. You can also use Nginx or other reverse proxies.

## Caddy (Included)

The included `Caddyfile` provides automatic HTTPS via Let's Encrypt:

```caddy
deploymate.example.com {
    reverse_proxy app:3000
}
```

Update the domain in the Caddyfile before deploying.

## Nginx

If you prefer Nginx, here is a sample configuration:

```nginx
server {
    listen 80;
    server_name deploymate.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name deploymate.example.com;

    ssl_certificate /etc/letsencrypt/live/deploymate.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/deploymate.example.com/privkey.pem;

    client_max_body_size 500M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Important Notes

- Set `client_max_body_size` (Nginx) or equivalent to accommodate large build files (100MB+).
- Ensure `X-Forwarded-Proto` is passed correctly for HTTPS detection.
- Set `NEXTAUTH_URL` to your public domain with HTTPS.
