# Deploy — Attra Concierge API

## Visão geral

O Attra Concierge é um servidor Node.js leve que serve como backend para um Custom GPT da OpenAI. Ele se conecta à API AutoConf para buscar o estoque real da Attra Veículos.

**Requisitos mínimos:**
- Node.js 20+
- ~50–80 MB de RAM
- Uma porta livre (sugestão: 3001)
- Subdomínio com HTTPS (obrigatório para GPT Actions da OpenAI)

O serviço pode rodar na mesma VPS que já hospeda o N8N.

---

## Opção A — Node.js direto com systemd

### 1. Clonar e buildar

```bash
git clone https://github.com/Dexi-Digital/attra-concierge.git /opt/attra-concierge
cd /opt/attra-concierge

corepack enable
pnpm install
pnpm --filter @attra/shared build
pnpm --filter @attra/server build
pnpm --filter @attra/web build
```

### 2. Criar arquivo de ambiente

```bash
cat > /opt/attra-concierge/.env << 'EOF'
NODE_ENV=production
APP_PORT=3001
APP_HOST=0.0.0.0
APP_BASE_URL=https://concierge.attraveiculos.com.br
AUTOCONF_BASE_URL=https://api.autoconf.com.br
AUTOCONF_AUTH_TOKEN=<TOKEN_AUTH_AQUI>
AUTOCONF_REVENDA_TOKEN=<TOKEN_REVENDA_AQUI>
HANDOFF_WEBHOOK_URL=https://webhook.dexidigital.com.br/webhook/integracao-openai

# OAuth 2.1 — obrigatório para o fluxo com ChatGPT
JWT_SECRET=<openssl rand -base64 48>
OAUTH_CLIENT_ID=<client_id gerado pelo ChatGPT Builder>
OAUTH_REDIRECT_URI=https://chatgpt.com/connector/oauth/<id>
MCP_AUTH_REQUIRED=true
EOF

chmod 600 /opt/attra-concierge/.env
```

### 3. Testar manualmente

```bash
node --env-file=/opt/attra-concierge/.env \
  /opt/attra-concierge/apps/server/dist/apps/server/src/index.js
```

Deve exibir:
```
[AutoConf] Using real AutoConf API for vehicle data
Attra Concierge disponível em https://concierge.attraveiculos.com.br na porta 3001.
```

### 4. Criar serviço systemd

```bash
sudo tee /etc/systemd/system/attra-concierge.service << 'EOF'
[Unit]
Description=Attra Concierge API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/attra-concierge
ExecStart=/usr/bin/node --env-file=/opt/attra-concierge/.env apps/server/dist/apps/server/src/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable attra-concierge
sudo systemctl start attra-concierge
sudo systemctl status attra-concierge
```

### 5. Logs

```bash
sudo journalctl -u attra-concierge -f
```

---

## Opção B — Docker

### 1. Build e run

```bash
cd /opt/attra-concierge

docker build -t attra-concierge .

docker run -d \
  --name attra-concierge \
  --restart always \
  -p 3001:3000 \
  -e NODE_ENV=production \
  -e APP_BASE_URL=https://concierge.attraveiculos.com.br \
  -e AUTOCONF_BASE_URL=https://api.autoconf.com.br \
  -e AUTOCONF_AUTH_TOKEN=<TOKEN_AUTH_AQUI> \
  -e AUTOCONF_REVENDA_TOKEN=<TOKEN_REVENDA_AQUI> \
  -e HANDOFF_WEBHOOK_URL=https://webhook.dexidigital.com.br/webhook/integracao-openai \
  -e JWT_SECRET=<openssl rand -base64 48> \
  -e OAUTH_CLIENT_ID=<client_id do ChatGPT Builder> \
  -e OAUTH_REDIRECT_URI=https://chatgpt.com/connector/oauth/<id> \
  -e MCP_AUTH_REQUIRED=true \
  attra-concierge
```

### 2. Verificar

```bash
docker logs attra-concierge
curl http://localhost:3001/health
```

---

## Proxy reverso (Nginx)

Adicionar um server block para o subdomínio:

```nginx
server {
    listen 443 ssl http2;
    server_name concierge.attraveiculos.com.br;

    ssl_certificate     /etc/letsencrypt/live/concierge.attraveiculos.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/concierge.attraveiculos.com.br/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name concierge.attraveiculos.com.br;
    return 301 https://$host$request_uri;
}
```

### Gerar certificado SSL

```bash
sudo certbot --nginx -d concierge.attraveiculos.com.br
```

---

## Validação pós-deploy

```bash
# Health check
curl https://concierge.attraveiculos.com.br/health

# Listar tools disponíveis
curl https://concierge.attraveiculos.com.br/tools

# Testar busca real
curl -s -X POST https://concierge.attraveiculos.com.br/tools/search_inventory \
  -H 'Content-Type: application/json' \
  -d '{"queryText":"porsche"}' | head -c 500
```

Todos devem retornar JSON válido com status 200.

---

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `NODE_ENV` | Não | `production` em produção (padrão: development) |
| `APP_PORT` | Não | Porta do servidor (padrão: 3000) |
| `APP_HOST` | Não | Host de bind (padrão: 0.0.0.0) |
| `APP_BASE_URL` | **Sim** | URL pública com HTTPS |
| `AUTOCONF_BASE_URL` | Não | URL da API AutoConf (padrão: https://api.autoconf.com.br) |
| `AUTOCONF_AUTH_TOKEN` | **Sim** | Token de autenticação da API AutoConf |
| `AUTOCONF_REVENDA_TOKEN` | **Sim** | Token da revenda na API AutoConf |
| `HANDOFF_WEBHOOK_URL` | Não | Webhook N8N para handoff de leads (padrão configurado) |
| `JWT_SECRET` | **Sim (prod)** | Segredo HS256 para assinar tokens. Gere: `openssl rand -base64 48` |
| `OAUTH_CLIENT_ID` | Sim (prod) | `client_id` gerado pelo ChatGPT Builder ao registrar a Action |
| `OAUTH_REDIRECT_URI` | Sim (prod) | `redirect_uri` gerado pelo ChatGPT Builder (copiar exatamente) |
| `MCP_AUTH_REQUIRED` | Não | `true` em produção para exigir Bearer token no MCP |
| `MCP_API_KEYS` | Não | API keys para acesso service-to-service. Formato: `token:scope1,scope2` |

> O servidor recusa o start em `NODE_ENV=production` sem `JWT_SECRET`, `AUTOCONF_AUTH_TOKEN` e `AUTOCONF_REVENDA_TOKEN` configurados.

---

## Atualização

```bash
cd /opt/attra-concierge
git pull
pnpm install
pnpm --filter @attra/shared build
pnpm --filter @attra/server build
pnpm --filter @attra/web build
sudo systemctl restart attra-concierge
```

Ou com Docker:

```bash
cd /opt/attra-concierge
git pull
docker build -t attra-concierge .
docker stop attra-concierge && docker rm attra-concierge
# Rodar novamente o comando docker run da Opção B
```

