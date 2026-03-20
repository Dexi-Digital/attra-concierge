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
    autoconfRevendaToken: source.AUTOCONF_REVENDA_TOKEN ?? ""
  };
}
