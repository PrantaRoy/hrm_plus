import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./logger";

const app = createApp();

app.listen(Number(env.PORT), () => {
  logger.info(`HRM PLUS backend listening on port ${env.PORT}`);
});
