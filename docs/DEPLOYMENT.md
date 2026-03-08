# Deployment Guide

This guide covers the deployment pipeline for the Al-Ahram Developments project, including Docker multi-stage builds, docker-compose with nginx reverse proxy, environment configuration, CI/CD with GitHub Actions, health checks, and logging.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Docker Multi-Stage Build](#docker-multi-stage-build)
3. [Docker Compose with Nginx](#docker-compose-with-nginx)
4. [Nginx Configuration](#nginx-configuration)
5. [Environment Configuration](#environment-configuration)
6. [CI/CD with GitHub Actions](#cicd-with-github-actions)
7. [Health Check](#health-check)
8. [Logging](#logging)
9. [SSL/TLS Configuration](#ssltls-configuration)
10. [Scaling and Production Considerations](#scaling-and-production-considerations)
11. [Rollback Strategy](#rollback-strategy)

---

## Architecture Overview

```
                          Internet
                            |
                            v
                     +------+------+
                     |   Nginx     |  (Port 80/443)
                     |  Reverse    |  - SSL termination
                     |  Proxy      |  - Gzip compression
                     |             |  - Rate limiting
                     +------+------+  - Security headers
                            |
                            v
                     +------+------+
                     |  Angular    |  (Port 4000)
                     |  SSR Node   |  - Express server
                     |  App        |  - Server-side rendering
                     |             |  - Static asset serving
                     +-------------+
```

Both services run as Docker containers orchestrated by docker-compose.

---

## Docker Multi-Stage Build

The project uses a two-stage Docker build to minimize the production image size.

### Dockerfile

```dockerfile
# ==========================================
# Al-Ahram Developments - Multi-stage Build
# ==========================================

# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=build /app/dist/alahram-developments ./dist/alahram-developments
COPY --from=build /app/package.json ./
COPY --from=build /app/package-lock.json ./

RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

RUN addgroup -g 1001 -S nodejs && \
    adduser -S angular -u 1001 -G nodejs
USER angular

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/health || exit 1

CMD ["node", "dist/alahram-developments/server/server.mjs"]
```

### Stage 1: Build

| Step | What It Does |
|------|--------------|
| `FROM node:20-alpine AS build` | Uses a lightweight Alpine-based Node 20 image |
| `npm ci --ignore-scripts` | Installs all dependencies (including dev) deterministically |
| `COPY . .` | Copies the entire source code |
| `npm run build` | Runs the Angular production build (SSR + browser bundles) |

### Stage 2: Production

| Step | What It Does |
|------|--------------|
| `FROM node:20-alpine AS production` | Fresh Alpine image (build stage artifacts discarded) |
| `COPY --from=build` | Copies only the built output and package files |
| `npm ci --omit=dev` | Installs only production dependencies (Express, etc.) |
| `addgroup/adduser` | Creates a non-root user for security |
| `USER angular` | Runs the process as the non-root user |
| `HEALTHCHECK` | Configures container health monitoring |
| `CMD` | Starts the Angular SSR Express server |

### Build Commands

```bash
# Build the Docker image
npm run docker:build
# or
docker build -t alahram-developments .

# Run the container
docker run -p 4000:4000 alahram-developments
```

### Image Size Optimization

The multi-stage build ensures the production image contains only:
- The compiled Angular bundles (`dist/`)
- Production Node.js dependencies
- The Node.js runtime

It does **not** contain:
- Source code (`src/`)
- Development dependencies (TypeScript, ESLint, etc.)
- Build cache or node_modules from the build stage

Expected production image size: approximately 150-200 MB.

---

## Docker Compose with Nginx

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: alahram-app
    ports:
      - '4000:4000'
    environment:
      - NODE_ENV=production
      - PORT=4000
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'wget', '--no-verbose', '--tries=1', '--spider', 'http://localhost:4000/api/health']
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s

  nginx:
    image: nginx:alpine
    container_name: alahram-nginx
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      app:
        condition: service_healthy
    restart: unless-stopped
```

### Key Points

- **`depends_on` with `service_healthy`**: Nginx only starts after the app container passes its health check. This prevents Nginx from proxying to a server that is not ready.
- **`restart: unless-stopped`**: Both containers automatically restart if they crash, unless manually stopped.
- **`ports: '4000:4000'`**: The app port is exposed for direct access (useful for debugging). In production behind a load balancer, you may remove this.

### Docker Compose Commands

```bash
# Start all services
npm run docker:up
# or
docker compose up -d

# Stop all services
npm run docker:down
# or
docker compose down

# View logs
docker compose logs -f

# View logs for a specific service
docker compose logs -f app
docker compose logs -f nginx

# Rebuild and restart
docker compose up -d --build

# Check service status
docker compose ps
```

---

## Nginx Configuration

### nginx.conf

```nginx
worker_processes auto;

events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    access_log  /var/log/nginx/access.log;
    error_log   /var/log/nginx/error.log;

    # Performance
    sendfile        on;
    tcp_nopush      on;
    tcp_nodelay     on;
    keepalive_timeout 65;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript
               application/xml+rss application/atom+xml image/svg+xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;

    # Upstream
    upstream angular_ssr {
        server app:4000;
        keepalive 32;
    }

    server {
        listen 80;
        server_name localhost;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # Health check endpoint
        location /api/health {
            proxy_pass http://angular_ssr;
            proxy_set_header Host $host;
        }

        # Static assets with long cache
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            proxy_pass http://angular_ssr;
            proxy_set_header Host $host;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Angular SSR
        location / {
            limit_req zone=general burst=20 nodelay;
            proxy_pass http://angular_ssr;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
        }
    }
}
```

### Nginx Features

| Feature | Configuration |
|---------|--------------|
| Gzip compression | Level 6 for text, JSON, JS, CSS, SVG |
| Rate limiting | 10 requests/second per IP, burst of 20 |
| Static caching | 1 year for hashed assets (`public, immutable`) |
| Security headers | X-Frame-Options, X-Content-Type-Options, etc. |
| Keepalive | 32 connections to upstream |
| Proxy headers | Forwards real IP and protocol |

---

## Environment Configuration

### Environment Files

| File | Configuration | Build Command |
|------|--------------|---------------|
| `environment.ts` | Development | `ng serve` |
| `environment.staging.ts` | Staging | `npm run build:staging` |
| `environment.prod.ts` | Production | `npm run build` |

### Environment Interface

```typescript
// src/app/core/models/environment.model.ts
export interface Environment {
  production: boolean;
  apiUrl: string;
  appName: string;
  defaultLocale: 'ar' | 'en';
  supportedLocales: readonly string[];
}
```

### Environment Values

**Development** (`environment.ts`):
```typescript
export const environment: Environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  appName: 'Al-Ahram Developments',
  defaultLocale: 'ar',
  supportedLocales: ['ar', 'en'] as const,
};
```

**Staging** (`environment.staging.ts`):
```typescript
export const environment: Environment = {
  production: false,
  apiUrl: 'https://staging-api.alahram-developments.com/api',
  appName: 'Al-Ahram Developments',
  defaultLocale: 'ar',
  supportedLocales: ['ar', 'en'] as const,
};
```

**Production** (`environment.prod.ts`):
```typescript
export const environment: Environment = {
  production: true,
  apiUrl: 'https://api.alahram-developments.com/api',
  appName: 'Al-Ahram Developments',
  defaultLocale: 'ar',
  supportedLocales: ['ar', 'en'] as const,
};
```

### File Replacements

`angular.json` configures file replacements for each build configuration:

```json
{
  "configurations": {
    "production": {
      "fileReplacements": [
        {
          "replace": "src/environments/environment.ts",
          "with": "src/environments/environment.prod.ts"
        }
      ]
    },
    "staging": {
      "fileReplacements": [
        {
          "replace": "src/environments/environment.ts",
          "with": "src/environments/environment.staging.ts"
        }
      ]
    }
  }
}
```

### Docker Environment Variables

Runtime environment variables can be passed via docker-compose:

```yaml
services:
  app:
    environment:
      - NODE_ENV=production
      - PORT=4000
```

Note: Angular environment files are compile-time constants baked into the bundle. The `NODE_ENV` and `PORT` variables are for the Express server only. To change `apiUrl` or other Angular-level config at runtime, you would need to implement a runtime config loader.

---

## CI/CD with GitHub Actions

### Workflow File

Create `.github/workflows/ci.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # =========================================
  # Job 1: Lint
  # =========================================
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Check formatting
        run: npm run format:check

  # =========================================
  # Job 2: Build
  # =========================================
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build production
        run: npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 7

  # =========================================
  # Job 3: Test (when tests are added)
  # =========================================
  # test:
  #   name: Test
  #   runs-on: ubuntu-latest
  #   needs: lint
  #   steps:
  #     - name: Checkout
  #       uses: actions/checkout@v4
  #
  #     - name: Setup Node.js
  #       uses: actions/setup-node@v4
  #       with:
  #         node-version: ${{ env.NODE_VERSION }}
  #         cache: 'npm'
  #
  #     - name: Install dependencies
  #       run: npm ci
  #
  #     - name: Run unit tests
  #       run: npm test -- --watch=false --browsers=ChromeHeadless
  #
  #     - name: Upload coverage
  #       uses: actions/upload-artifact@v4
  #       with:
  #         name: coverage
  #         path: coverage/

  # =========================================
  # Job 4: Docker Build and Push
  # =========================================
  docker:
    name: Docker Build & Push
    runs-on: ubuntu-latest
    needs: [build]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    permissions:
      contents: read
      packages: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=
            type=raw,value=latest

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}

  # =========================================
  # Job 5: Deploy to Staging
  # =========================================
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: docker
    if: github.ref == 'refs/heads/main'
    environment: staging
    steps:
      - name: Deploy to staging server
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: ${{ secrets.STAGING_USER }}
          key: ${{ secrets.STAGING_SSH_KEY }}
          script: |
            cd /opt/alahram-developments
            docker compose pull
            docker compose up -d --remove-orphans
            docker image prune -f

  # =========================================
  # Job 6: Deploy to Production (manual)
  # =========================================
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: deploy-staging
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://alahram-developments.com
    steps:
      - name: Deploy to production server
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.PRODUCTION_HOST }}
          username: ${{ secrets.PRODUCTION_USER }}
          key: ${{ secrets.PRODUCTION_SSH_KEY }}
          script: |
            cd /opt/alahram-developments
            docker compose pull
            docker compose up -d --remove-orphans
            docker image prune -f

      - name: Verify deployment
        run: |
          sleep 10
          curl --fail --silent https://alahram-developments.com/api/health || exit 1
          echo "Deployment verified successfully"
```

### Pipeline Flow

```
push to main
    |
    v
[Lint] -----> [Build] -----> [Docker Build & Push] -----> [Deploy Staging] -----> [Deploy Production]
  |              |                                                                      |
  |              |                                                              (manual approval)
  ESLint      Angular                GHCR                   SSH + compose         SSH + compose
  Prettier    prod build             push                   pull + up             pull + up
```

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `STAGING_HOST` | Staging server IP/hostname |
| `STAGING_USER` | SSH username for staging |
| `STAGING_SSH_KEY` | SSH private key for staging |
| `PRODUCTION_HOST` | Production server IP/hostname |
| `PRODUCTION_USER` | SSH username for production |
| `PRODUCTION_SSH_KEY` | SSH private key for production |

### GitHub Environments

Configure two environments in GitHub repository settings:
- **staging**: No protection rules.
- **production**: Require manual approval from designated reviewers.

---

## Health Check

### Endpoint

The health check is exposed at `/api/health`. It is used by:
- Docker HEALTHCHECK directive
- docker-compose health check condition
- Nginx upstream health monitoring
- CI/CD deployment verification

### Adding the Health Check to the Express Server

In `src/server.ts`, add before the static file middleware:

```typescript
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env['NODE_ENV'] || 'development',
  });
});
```

### Health Check Response

```json
{
  "status": "healthy",
  "timestamp": "2026-03-07T12:00:00.000Z",
  "uptime": 3600.5,
  "environment": "production"
}
```

### Docker Health Check Configuration

From the Dockerfile:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/health || exit 1
```

| Parameter | Value | Description |
|-----------|-------|-------------|
| `--interval` | 30s | Check every 30 seconds |
| `--timeout` | 3s | Fail if no response within 3 seconds |
| `--start-period` | 5s | Wait 5 seconds before first check |
| `--retries` | 3 | Mark unhealthy after 3 consecutive failures |

---

## Logging

### Express Server Logging

The Express server logs to stdout, which Docker captures:

```typescript
// Basic request logging
console.log(`Node Express server listening on http://localhost:${port}`);
```

### Nginx Logging

Nginx logs to standard locations:

```nginx
access_log  /var/log/nginx/access.log;
error_log   /var/log/nginx/error.log;
```

### Viewing Logs

```bash
# All container logs
docker compose logs -f

# App logs only
docker compose logs -f app

# Nginx logs only
docker compose logs -f nginx

# Last 100 lines
docker compose logs --tail=100 app

# Since a specific time
docker compose logs --since="2026-03-07T10:00:00" app
```

### Production Logging Recommendations

For production, consider adding structured logging:

```typescript
// Example: structured JSON logging
function log(level: string, message: string, meta?: Record<string, unknown>): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
  console.log(JSON.stringify(entry));
}

log('info', 'Server started', { port: 4000 });
log('error', 'Request failed', { path: '/api/health', status: 500 });
```

This produces logs that can be parsed by log aggregation tools (ELK Stack, Datadog, CloudWatch).

---

## SSL/TLS Configuration

For production with HTTPS, update the Nginx configuration and docker-compose to include SSL certificates:

### docker-compose.yml Addition

```yaml
services:
  nginx:
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt/live/alahram-developments.com:/etc/nginx/ssl:ro
```

### Nginx SSL Server Block

```nginx
server {
    listen 80;
    server_name alahram-developments.com www.alahram-developments.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name alahram-developments.com www.alahram-developments.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    add_header Strict-Transport-Security "max-age=63072000" always;

    # ... rest of server block
}
```

---

## Scaling and Production Considerations

### Horizontal Scaling

To run multiple app instances behind Nginx:

```yaml
services:
  app:
    deploy:
      replicas: 3
```

Update Nginx upstream:

```nginx
upstream angular_ssr {
    server app:4000;
    keepalive 32;
}
```

Docker Compose with `replicas` will automatically load-balance across instances.

### Resource Limits

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### PM2 for Process Management (Alternative to Docker Scaling)

For running multiple Node.js instances within a single container:

```json
{
  "apps": [{
    "name": "alahram-ssr",
    "script": "dist/alahram-developments/server/server.mjs",
    "instances": "max",
    "exec_mode": "cluster",
    "env": {
      "NODE_ENV": "production",
      "PORT": "4000"
    }
  }]
}
```

---

## Rollback Strategy

### Quick Rollback

```bash
# On the server, roll back to the previous image
docker compose down
docker compose pull  # This pulls "latest" -- for rollback, pin a specific tag
docker compose up -d
```

### Tagged Rollback

Each build pushes a SHA-tagged image. To roll back to a specific version:

```bash
# Edit docker-compose to use a specific tag
# image: ghcr.io/org/alahram-developments:abc123f
docker compose up -d
```

### Verify After Rollback

```bash
# Check the health endpoint
curl http://localhost:4000/api/health

# Check container status
docker compose ps

# Check recent logs
docker compose logs --tail=50 app
```
