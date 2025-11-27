import winston from "winston";
import path from "path";
import fs from "fs";

// Ensure logs directory exists before transports attempt to write to it
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    if (stack) {
      return `${timestamp} [${level}]: ${message}\n${stack}`;
    }
    return `${timestamp} [${level}]: ${message}`;
  })
);

const enableExceptionHandlers =
  process.env.ENABLE_WINSTON_EXCEPTION_HANDLERS === "true";

const exceptionTransports = enableExceptionHandlers
  ? [
      new winston.transports.File({
        filename: path.join(process.cwd(), "logs", "exceptions.log"),
      }),
    ]
  : [];

const rejectionTransports = enableExceptionHandlers
  ? [
      new winston.transports.File({
        filename: path.join(process.cwd(), "logs", "rejections.log"),
      }),
    ]
  : [];

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: logFormat,
  defaultMeta: { service: "alumni-accel-api" },
  exitOnError: false,
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat,
    }),

    // File transport for errors
    new winston.transports.File({
      filename: path.join(process.cwd(), "logs", "error.log"),
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // File transport for all logs
    new winston.transports.File({
      filename: path.join(process.cwd(), "logs", "combined.log"),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  exceptionHandlers: exceptionTransports,
  rejectionHandlers: rejectionTransports,
});

export { logger };
