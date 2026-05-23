import { createLogger, format, transports } from "winston";

const { combine, timestamp, json } = format;

export const logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(timestamp(), json()),
  transports: [new transports.Console()],
});

export default logger;
