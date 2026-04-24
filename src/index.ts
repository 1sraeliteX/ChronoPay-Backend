import "dotenv/config";
import { createApp as createBaseApp, type AppFactoryOptions } from "./app.js";
import { loadEnvConfig, type EnvConfig } from "./config/env.js";

const config = loadEnvConfig(process.env);

interface AppListener {
  listen(port: number, callback?: () => void): unknown;
}

export function createApp(options: AppFactoryOptions = {}) {
  return createBaseApp(options);
}

export function startServer(app: AppListener, runtimeConfig: EnvConfig): unknown {
  return app.listen(runtimeConfig.port, () => {
    console.log(`ChronoPay API listening on http://localhost:${runtimeConfig.port}`);
  });
}

const app = createApp();

if (config.nodeEnv !== "test") {
  startServer(app, config);
}

export default app;
