export type AppEnvironment = "development" | "test" | "production";

export interface AppEnv {
  nodeEnv: AppEnvironment;
  appHost: string;
  appPort: number;
  appBaseUrl: string;
  webBaseUrl: string;
  autoconfBaseUrl: string;
  autoconfAuthToken: string;
  autoconfRevendaToken: string;
  handoffWebhookUrl: string;
  /**
   * MCP API key registry (optional).
   * Format: "token1:scope1,scope2;token2:scope1"
   * When absent in dev, anonymous access with all scopes is granted.
   */
  mcpApiKeys?: string;
  /**
   * When true, Bearer token is required even in development.
   * Defaults to false (dev is open by default).
   */
  mcpAuthRequired: boolean;
  /**
   * Secret used to sign and verify HS256 JWT access tokens.
   * Required in production when OAuth 2.1 authorization code flow is used.
   * Generate with: openssl rand -base64 48
   */
  jwtSecret?: string;
  /**
   * The OAuth 2.1 client_id registered for the ChatGPT / OpenAI App.
   * Required when running the full authorization code flow.
   */
  oauthClientId?: string;
  /**
   * Exact redirect_uri allowed for the OAuth 2.1 flow.
   * Copied from the "URL de retorno" field shown by the OpenAI App connector.
   * Example: https://chatgpt.com/connector/oauth/ohId_bwhSyVf
   */
  oauthRedirectUri?: string;
}

export function readEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  return {
    nodeEnv: (source.NODE_ENV as AppEnvironment | undefined) ?? "development",
    appHost: source.APP_HOST ?? "0.0.0.0",
    appPort: Number(source.APP_PORT ?? 3000),
    appBaseUrl: source.APP_BASE_URL ?? "http://localhost:3000",
    webBaseUrl: source.WEB_BASE_URL ?? "http://localhost:5173",
    autoconfBaseUrl: source.AUTOCONF_BASE_URL ?? "https://api.autoconf.com.br",
    autoconfAuthToken: source.AUTOCONF_AUTH_TOKEN ?? "",
    autoconfRevendaToken: source.AUTOCONF_REVENDA_TOKEN ?? "",
    handoffWebhookUrl:
      source.HANDOFF_WEBHOOK_URL ??
      "https://webhook.dexidigital.com.br/webhook/integracao-openai",
    mcpApiKeys: source.MCP_API_KEYS,
    mcpAuthRequired: source.MCP_AUTH_REQUIRED === "true",
    jwtSecret: source.JWT_SECRET,
    oauthClientId: source.OAUTH_CLIENT_ID,
    oauthRedirectUri: source.OAUTH_REDIRECT_URI,
  };
}
