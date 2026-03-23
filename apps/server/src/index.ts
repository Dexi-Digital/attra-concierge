import { appConfig } from "./config/app-config.js";
import { createAppServer } from "./server/app.js";

/* ─── Validação de startup ───────────────────────────────────────── */

function assertProductionReadiness(): void {
  const { env } = appConfig;
  if (env.nodeEnv !== "production") return;

  const errors: string[] = [];

  if (!env.jwtSecret) {
    errors.push("JWT_SECRET não configurado. Gere com: openssl rand -base64 48");
  }
  if (env.jwtSecret && env.jwtSecret.length < 32) {
    errors.push("JWT_SECRET muito curto. Mínimo de 32 caracteres para segurança adequada.");
  }
  if (!env.autoconfAuthToken) {
    errors.push("AUTOCONF_AUTH_TOKEN não configurado.");
  }
  if (!env.autoconfRevendaToken) {
    errors.push("AUTOCONF_REVENDA_TOKEN não configurado.");
  }

  if (errors.length > 0) {
    console.error("\n[STARTUP] Configuração inválida para produção:");
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    console.error("\nServidor encerrado. Corrija as variáveis de ambiente e reinicie.\n");
    process.exit(1);
  }

  if (!env.oauthClientId || !env.oauthRedirectUri) {
    console.warn("[STARTUP] AVISO: OAUTH_CLIENT_ID e/ou OAUTH_REDIRECT_URI não configurados.");
    console.warn("          O fluxo OAuth 2.1 com ChatGPT não funcionará até serem definidos.");
  }
}

assertProductionReadiness();

/* ─── Inicialização do servidor ──────────────────────────────────── */

const server = createAppServer();

server.listen(appConfig.env.appPort, appConfig.env.appHost, () => {
  console.log(
    `${appConfig.name} disponível em ${appConfig.env.appBaseUrl} na porta ${appConfig.env.appPort}.`
  );
});
