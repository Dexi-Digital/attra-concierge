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
```

### 2. Criar arquivo de ambiente

```bash
cat > /opt/attra-concierge/.env << 'EOF'
APP_PORT=3001
APP_HOST=0.0.0.0
APP_BASE_URL=https://concierge.attraveiculos.com.br
AUTOCONF_BASE_URL=https://api.autoconf.com.br
AUTOCONF_AUTH_TOKEN=<TOKEN_AUTH_AQUI>
AUTOCONF_REVENDA_TOKEN=<TOKEN_REVENDA_AQUI>
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
  -e APP_BASE_URL=https://concierge.attraveiculos.com.br \
  -e AUTOCONF_BASE_URL=https://api.autoconf.com.br \
  -e AUTOCONF_AUTH_TOKEN=<TOKEN_AUTH_AQUI> \
  -e AUTOCONF_REVENDA_TOKEN=<TOKEN_REVENDA_AQUI> \
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
| `APP_PORT` | Não | Porta do servidor (padrão: 3000) |
| `APP_HOST` | Não | Host de bind (padrão: 0.0.0.0) |
| `APP_BASE_URL` | Sim | URL pública com HTTPS |
| `AUTOCONF_BASE_URL` | Não | URL da API AutoConf (padrão: https://api.autoconf.com.br) |
| `AUTOCONF_AUTH_TOKEN` | Sim | Token de autenticação da API AutoConf |
| `AUTOCONF_REVENDA_TOKEN` | Sim | Token da revenda na API AutoConf |

---

## Atualização

```bash
cd /opt/attra-concierge
git pull
pnpm install
pnpm --filter @attra/shared build
pnpm --filter @attra/server build
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

