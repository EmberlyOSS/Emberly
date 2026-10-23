# NodeByte Discord Bot Deployment Guide

Complete guide for deploying the NodeByte Discord Bot (with Transcript Server) on Ubuntu using systemd and Nginx with Cloudflare Origin Certificates.

**Service:** Discord Bot + Express Transcript Server (Node.js 18+ with Prisma)  
**Environment:** Ubuntu 20.04 LTS or 22.04 LTS  
**Date:** February 2026

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [System Setup](#system-setup)
3. [Discord Bot Deployment](#discord-bot-deployment)
4. [Nginx Configuration](#nginx-configuration)
5. [SSL/TLS Setup](#ssltls-setup)
6. [Monitoring](#monitoring)
7. [Maintenance](#maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- Ubuntu 20.04 LTS or 22.04 LTS
- Node.js 18+
- npm or yarn
- PostgreSQL 12+
- Nginx 1.18+ (for transcript server)
- Git

### Required Accounts
- Discord account with bot created
- Cloudflare account with domain configured (for transcripts)
- Access to server with sudo privileges

### Domain Assumptions
- Transcript Server: `transcripts.yourdomain.com`

---

## System Setup

### 1. Update System
```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Install Dependencies

#### Node.js 18+
```bash
# Add NodeSource repository for Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

#### PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
```

#### Nginx (for transcript server)
```bash
sudo apt install -y nginx
```

#### Additional Tools
```bash
sudo apt install -y git curl wget htop ufw
```

### 3. Create Deploy User
```bash
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG sudo deploy
```

### 4. Setup Firewall
```bash
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 5. Create Application Directory
```bash
sudo mkdir -p /var/www/nodebyte/client
sudo chown -R deploy:deploy /var/www/nodebyte
```

---

## Discord Bot Deployment

### 1. Discord Bot Setup

Before deploying, ensure you have:

1. **Created a Discord Bot** in Discord Developer Portal
2. **Generated Bot Token**
3. **Enabled Required Intents:**
   - Server Members Intent
   - Message Content Intent
   - Presence Intent (if needed)
4. **Invited Bot to Server** with proper permissions

### 2. Clone Repository
```bash
cd /var/www/nodebyte
sudo -u deploy git clone <client-repo-url> client
cd client
sudo -u deploy git checkout main  # or your desired branch
```

### 3. Setup Environment Variables
```bash
sudo -u deploy cp .env.example .env
sudo -u deploy nano .env
```

Configure `.env`:
See [`.env.example`](../.env.example) for every variable. Moderation, logs and support answers live in the separate Emberly mod bot (`emberly-mod-bot`), so this bot needs no channel or role IDs.

### 4. Setup Database
```bash
# As postgres user
sudo -u postgres createdb nodebyte_bot
sudo -u postgres createdb nodebyte_bot_shadow
sudo -u postgres createuser deploy
sudo -u postgres psql -c "ALTER USER deploy WITH PASSWORD 'secure-password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE nodebyte_bot TO deploy;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE nodebyte_bot_shadow TO deploy;"

# Grant schema permissions
sudo -u postgres psql -d nodebyte_bot -c "GRANT ALL PRIVILEGES ON SCHEMA public TO deploy;"
sudo -u postgres psql -d nodebyte_bot_shadow -c "GRANT ALL PRIVILEGES ON SCHEMA public TO deploy;"

# Verify connection
sudo -u postgres psql -c "SELECT 1" -d nodebyte_bot
```

### 5. Install Dependencies
```bash
cd /var/www/nodebyte/client

# Install dependencies
sudo -u deploy npm ci

# Verify installation
sudo -u deploy npm list --depth=0
```

### 6. Setup Prisma Database
```bash
cd /var/www/nodebyte/client

# Generate Prisma Client
sudo -u deploy npm run prisma:generate

# Run database migrations
sudo -u deploy npm run prisma:migrate

# Verify database tables
sudo -u postgres psql -d nodebyte_bot -c "\dt"
```

### 7. Build Application
```bash
cd /var/www/nodebyte/client

# Build TypeScript
sudo -u deploy npm run build

# Verify build
ls -la dist/
```

### 8. Create Systemd Service

Create `/etc/systemd/system/nodebyte-bot.service`:

```ini
[Unit]
Description=NodeByte Discord Bot Service
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=deploy
WorkingDirectory=/var/www/nodebyte/client
Environment="PATH=/usr/bin:/bin:/usr/local/bin"
Environment="NODE_ENV=production"
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=15
StartLimitInterval=300
StartLimitBurst=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=nodebyte-bot

# Performance tuning
LimitNOFILE=65000
LimitNPROC=65000

# Security
PrivateTmp=yes
NoNewPrivileges=yes

[Install]
WantedBy=multi-user.target
```

### 9. Enable and Start Service
```bash
sudo systemctl daemon-reload
sudo systemctl enable nodebyte-bot
sudo systemctl start nodebyte-bot

# Verify
sudo systemctl status nodebyte-bot
sudo journalctl -u nodebyte-bot -n 50

# Check if bot is online in Discord
```

---

## Nginx Configuration

The Discord bot includes an Express server for serving ticket transcripts on port 3001 (configurable). This needs to be proxied through Nginx for HTTPS access.

### 1. Create Nginx Configuration

Create `/etc/nginx/sites-available/nodebyte-transcripts`:

```nginx
upstream transcripts {
    server 127.0.0.1:3001 max_fails=3 fail_timeout=30s;
    keepalive 16;
}

server {
    listen 80;
    listen [::]:80;
    server_name transcripts.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name transcripts.yourdomain.com;

    # SSL certificates (Cloudflare Origin Certificates)
    ssl_certificate /etc/ssl/certs/yourdomain.com.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.com.key;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-Robots-Tag "noindex, nofollow" always;

    # Logging
    access_log /var/log/nginx/transcripts-access.log combined;
    error_log /var/log/nginx/transcripts-error.log warn;

    # Rate limiting (stricter for transcripts)
    limit_req_zone $binary_remote_addr zone=transcript_limit:10m rate=10r/s;
    limit_req zone=transcript_limit burst=20 nodelay;

    # Client body size limit
    client_max_body_size 5M;

    root /var/www/nodebyte/client/public;

    # Health check
    location /health {
        proxy_pass http://transcripts;
        access_log off;
    }

    # Main application
    location / {
        proxy_pass http://transcripts;
        proxy_http_version 1.1;

        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
    }

    # Static files
    location ~ ^/(css|js|images|fonts)/ {
        try_files $uri @proxy;
        expires 7d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location @proxy {
        proxy_pass http://transcripts;
    }

    # Favicon
    location = /favicon.ico {
        proxy_pass http://transcripts;
        access_log off;
        expires 7d;
    }
}
```

### 2. Install Cloudflare Origin Certificates

```bash
# Create certificates directory
sudo mkdir -p /etc/ssl/certs /etc/ssl/private

# Create certificate file (get from Cloudflare Dashboard → SSL/TLS → Origin Server)
sudo tee /etc/ssl/certs/yourdomain.com.crt > /dev/null << 'EOF'
-----BEGIN CERTIFICATE-----
(Paste your Cloudflare certificate here)
-----END CERTIFICATE-----
EOF

# Create private key file
sudo tee /etc/ssl/private/yourdomain.com.key > /dev/null << 'EOF'
-----BEGIN PRIVATE KEY-----
(Paste your private key here)
-----END PRIVATE KEY-----
EOF

# Set correct permissions
sudo chmod 644 /etc/ssl/certs/yourdomain.com.crt
sudo chmod 600 /etc/ssl/private/yourdomain.com.key
sudo chown root:root /etc/ssl/certs/yourdomain.com.crt /etc/ssl/private/yourdomain.com.key
```

### 3. Enable Nginx Site
```bash
sudo ln -s /etc/nginx/sites-available/nodebyte-transcripts /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# Verify transcript server is accessible
curl http://localhost:3001/health
curl -k https://transcripts.yourdomain.com/health
```

---

## SSL/TLS Setup

### Cloudflare Configuration

1. **SSL/TLS → Overview**
   - Mode: Full (strict)
   - Minimum TLS Version: TLS 1.2

2. **Edge Certificates**
   - Always use HTTPS: On
   - HSTS: Enable (max-age=31536000)
   - TLS 1.3: On

3. **DNS**
   - A Record: `transcripts` → Your server IP (Proxied/Orange)

---

## Monitoring

### View Service Logs
```bash
# Real-time bot logs
sudo journalctl -u nodebyte-bot -f

# Last 50 lines
sudo journalctl -u nodebyte-bot -n 50

# Filter by time
sudo journalctl -u nodebyte-bot --since "2 hours ago"

# Filter errors only
sudo journalctl -u nodebyte-bot -p err
```

### Service Status
```bash
# Check bot status
sudo systemctl status nodebyte-bot

# Check if bot is responding in Discord
# Use Discord's bot status indicator or test commands
```

### Transcript Server Health
```bash
# Test local endpoint
curl http://localhost:3001/health

# Test through Nginx
curl -k https://transcripts.yourdomain.com/health

# Check transcript server logs
tail -f /var/log/nginx/transcripts-access.log
```

### System Resources
```bash
# CPU/Memory usage for bot
htop -p $(pgrep -f "npm start")

# Disk usage
df -h /var/www/nodebyte/client

# Network connections
sudo ss -tulpn | grep 3001

# Database connections
sudo -u postgres psql -d nodebyte_bot -c "SELECT count(*) FROM pg_stat_activity;"
```

### Discord Bot Health

Monitor in Discord:
- Bot online status (green indicator)
- Bot responds to commands
- Bot logs events in configured channels
- Ticket system working correctly

---

## Maintenance

### Updating Discord Bot

```bash
cd /var/www/nodebyte/client

# Stop bot
sudo systemctl stop nodebyte-bot

# Fetch latest changes
sudo -u deploy git fetch origin
sudo -u deploy git pull origin main

# Install updated dependencies
sudo -u deploy npm ci

# Run database migrations (if schema changed)
sudo -u deploy npm run prisma:migrate

# Rebuild application
sudo -u deploy npm run build

# Restart bot
sudo systemctl start nodebyte-bot

# Verify
sudo systemctl status nodebyte-bot
sudo journalctl -u nodebyte-bot -n 20
```

### Quick Update Script

Create `/home/deploy/update-bot.sh`:

```bash
#!/bin/bash
set -e

CLIENT_DIR="/var/www/nodebyte/client"
BRANCH="main"

echo "=== Updating NodeByte Discord Bot ==="

# Stop service
sudo systemctl stop nodebyte-bot

cd "$CLIENT_DIR"

# Pull changes
git fetch origin
git pull origin "$BRANCH"

# Update dependencies
npm ci

# Run any pending migrations
npm run prisma:migrate

# Rebuild
npm run build

# Start service
sudo systemctl start nodebyte-bot
echo "Bot updated and restarted"

# Check status
sleep 3
sudo systemctl status nodebyte-bot --no-pager
```

Make executable:
```bash
chmod +x /home/deploy/update-bot.sh
```

### Database Backups

```bash
# Backup database
sudo -u postgres pg_dump nodebyte_bot > /backup/nodebyte_bot_$(date +%Y%m%d_%H%M%S).sql

# Restore database
sudo -u postgres psql nodebyte_bot < /backup/nodebyte_bot_20260228_120000.sql

# Automated daily backup (add to crontab)
0 2 * * * sudo -u postgres pg_dump nodebyte_bot > /backup/nodebyte_bot_$(date +\%Y\%m\%d).sql
```

### Rollback
```bash
cd /var/www/nodebyte/client

# Stop service
sudo systemctl stop nodebyte-bot

# View recent commits
sudo -u deploy git log --oneline -10

# Checkout previous version
sudo -u deploy git checkout <commit-hash>

# Reinstall and rebuild
sudo -u deploy npm ci
sudo -u deploy npm run build

# Restart service
sudo systemctl start nodebyte-bot
```

### Prisma Schema Changes

```bash
cd /var/www/nodebyte/client

# Generate new Prisma client
sudo -u deploy npm run prisma:generate

# Create and apply migration
sudo -u deploy npm run prisma:migrate

# View migration status
sudo -u deploy npx prisma migrate status

# Reset database (WARNING: destructive)
sudo -u deploy npx prisma migrate reset
```

---

## Troubleshooting

### Bot Won't Start

```bash
# Check logs
sudo journalctl -u nodebyte-bot -n 100

# Verify Node.js and npm
node --version
npm --version

# Check environment variables
sudo -u deploy cat /var/www/nodebyte/client/.env | head -5

# Test bot token
# (Use Discord API to verify token is valid)

# Check database connection
sudo -u deploy psql postgresql://deploy:password@localhost:5432/nodebyte_bot -c "SELECT 1"

# Verify Discord Gateway connection
sudo journalctl -u nodebyte-bot | grep -i "gateway\|websocket"
```

### Bot Not Responding

```bash
# Check if bot is online in Discord
# Verify bot has proper permissions in server
# Check command registration

# Re-register slash commands (if using slash commands)
cd /var/www/nodebyte/client
sudo -u deploy node dist/deploy-commands.js

# Check rate limiting
sudo journalctl -u nodebyte-bot | grep -i "rate limit"
```

### Transcript Server Issues

```bash
# Check if transcript server is running
curl http://localhost:3001/health

# Check Nginx logs
sudo tail -f /var/log/nginx/transcripts-error.log

# Verify transcript port
sudo lsof -i :3001

# Test database connection for transcripts
sudo -u postgres psql -d nodebyte_bot -c "SELECT * FROM transcripts LIMIT 5;"
```

### Database Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log

# Check database connections
sudo -u postgres psql -d nodebyte_bot -c "SELECT count(*) FROM pg_stat_activity;"

# Reset Prisma client
cd /var/www/nodebyte/client
sudo -u deploy rm -rf node_modules/.prisma
sudo -u deploy npm run prisma:generate
```

### Permission Issues

```bash
# Fix ownership
sudo chown -R deploy:deploy /var/www/nodebyte/client

# Verify file permissions
ls -la /var/www/nodebyte/client

# Check database permissions
sudo -u postgres psql -d nodebyte_bot -c "SELECT grantee, privilege_type FROM information_schema.table_privileges WHERE table_schema='public';"
```

### Memory Leaks

```bash
# Monitor memory usage
watch -n 1 'ps aux | grep node'

# Restart bot if memory usage is high
sudo systemctl restart nodebyte-bot

# Consider adding memory limits to systemd service:
# MemoryMax=1G
# MemoryHigh=800M
```

---

## Quick Reference Commands

```bash
# Service management
sudo systemctl start nodebyte-bot
sudo systemctl stop nodebyte-bot
sudo systemctl restart nodebyte-bot
sudo systemctl status nodebyte-bot

# Logs
sudo journalctl -u nodebyte-bot -f
sudo tail -f /var/log/nginx/transcripts-access.log

# Health checks
curl http://localhost:3001/health
curl -k https://transcripts.yourdomain.com/health

# Rebuild
cd /var/www/nodebyte/client
sudo -u deploy npm run build
sudo systemctl restart nodebyte-bot

# Database
sudo -u postgres psql -d nodebyte_bot
sudo -u deploy npx prisma studio  # Web UI for database

# Update
cd /var/www/nodebyte/client
sudo -u deploy git pull origin main
sudo -u deploy npm ci
sudo -u deploy npm run prisma:migrate
sudo -u deploy npm run build
sudo systemctl restart nodebyte-bot
```

---

## Discord Bot Features

This bot includes:
- **Ticket System** - Support ticket management with transcripts
- **Moderation Tools** - User management and logging
- **Transcript Server** - Web-based transcript viewing
- **Auto-moderation** - Malware URL filtering and content moderation
- **Logging** - Comprehensive event logging

Make sure to configure all channel and role IDs in `.env` for full functionality.

---

**Last Updated:** February 28, 2026
