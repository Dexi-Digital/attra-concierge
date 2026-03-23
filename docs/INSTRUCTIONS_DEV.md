# Instruções para o Desenvolvedor — Attra Concierge

Este guia cobre tudo que o desenvolvedor precisa fazer para colocar o servidor em produção com OAuth 2.1 funcionando.

---

## 1. Variáveis de ambiente obrigatórias

Copie `.env.example` para `.env` e preencha os valores:

```bash
cp .env.example .env
```

### Variáveis críticas para produção

| Variável | Como obter |
|---|---|
| `JWT_SECRET` | `openssl rand -base64 48` — execute no terminal e cole o resultado |
| `AUTOCONF_AUTH_TOKEN` | Fornecido pela AutoConf — painel da revenda |
| `AUTOCONF_REVENDA_TOKEN` | Fornecido pela AutoConf — painel da revenda |
| `OAUTH_CLIENT_ID` | Gerado pelo ChatGPT Builder ao cadastrar a Action (o PM fornece) |
| `OAUTH_REDIRECT_URI` | Gerado pelo ChatGPT Builder ao cadastrar a Action (o PM fornece) |
| `MCP_AUTH_REQUIRED` | Definir como `true` em produção |

O servidor recusa o start em `NODE_ENV=production` sem `JWT_SECRET`, `AUTOCONF_AUTH_TOKEN` e `AUTOCONF_REVENDA_TOKEN`. Esse comportamento é intencional e está em `apps/server/src/index.ts`.

---

## 2. Fluxo OAuth 2.1 — como funciona

O ChatGPT autentica os usuários antes de chamar qualquer tool. O fluxo:

1. Usuário abre o GPT no ChatGPT
2. ChatGPT redireciona para `GET /oauth/authorize` com `code_challenge` (PKCE)
3. Servidor exibe formulário HTML de autorização
4. Usuário confirma — servidor emite `authorization_code`
5. ChatGPT troca o código por token via `POST /oauth/token`
6. Todas as chamadas subsequentes às tools usam `Authorization: Bearer <token>`

### Endpoints OAuth no servidor

- `GET /oauth/authorize` — exibe tela de autorização
- `POST /oauth/token` — troca code por JWT
- O token é validado em todas as rotas `/tools/*` e `/analytics`

### Chaves envolvidas

- `JWT_SECRET` — assina e verifica os tokens. Nunca expor publicamente.
- `OAUTH_CLIENT_ID` — identifica o app no ChatGPT Builder. Vem do PM após cadastro.
- `OAUTH_REDIRECT_URI` — URL de retorno que o ChatGPT usa após autorização. Vem do PM.

---

## 3. Build e deploy

### Desenvolvimento local

```bash
pnpm install
pnpm --filter @attra/shared build
pnpm --filter @attra/server dev
```

### Produção (VPS com systemd)

```bash
pnpm install --frozen-lockfile
pnpm --filter @attra/shared build
pnpm --filter @attra/server build
sudo systemctl restart attra-concierge
```

Ver `docs/deploy.md` para configuração completa do systemd e Docker.

---

## 4. Segurança — o que está implementado

- **CORS**: em produção restrito a `chatgpt.com` e `chat.openai.com`
- **Security headers**: HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- **Rate limiting**: rotas de escrita com limite mais restrito que leituras
- **`/analytics`**: protegido com Bearer token — não é público
- **`/privacidade`**: público — exigido pela OpenAI App Store (LGPD)
- **Startup validation**: o servidor não sobe em produção sem as vars críticas

---

## 5. Verificação pós-deploy

```bash
# Health check
curl https://concierge.attraveiculos.com.br/health

# Verifica se o YAML da spec está acessível
curl https://concierge.attraveiculos.com.br/openapi.yaml | head -5

# Verifica a página de privacidade (deve retornar HTML 200)
curl -I https://concierge.attraveiculos.com.br/privacidade

# Verifica que /analytics está protegido (deve retornar 401)
curl -I https://concierge.attraveiculos.com.br/analytics

# Verifica security headers
curl -I https://concierge.attraveiculos.com.br/health | grep -E "Strict|X-Frame|X-Content"
```

---

## 6. Após o PM cadastrar a Action no ChatGPT Builder

O PM vai te passar dois valores. Adicione ao `.env` de produção e reinicie o servidor:

```bash
OAUTH_CLIENT_ID=<valor que o PM fornecer>
OAUTH_REDIRECT_URI=<valor que o PM fornecer>
```

```bash
sudo systemctl restart attra-concierge
```

Depois confirme que o fluxo OAuth fecha chamando o endpoint:

```bash
curl https://concierge.attraveiculos.com.br/oauth/authorize?response_type=code&client_id=$OAUTH_CLIENT_ID&redirect_uri=$OAUTH_REDIRECT_URI&code_challenge=test&code_challenge_method=S256
```

Deve retornar o HTML do formulário de autorização (não um erro 400).

