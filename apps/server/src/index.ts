import { appConfig } from "./config/app-config.js";
import { createAppServer } from "./server/app.js";

const server = createAppServer();

server.listen(appConfig.env.appPort, appConfig.env.appHost, () => {
  console.log(
    `${appConfig.name} disponível em ${appConfig.env.appBaseUrl} na porta ${appConfig.env.appPort}.`
  );
});
