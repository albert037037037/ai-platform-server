import winston from 'winston';

const colorizer = winston.format.colorize();

const logger = winston.createLogger({
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 4,
  },
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.simple(),
    winston.format.printf((msg) => colorizer.colorize(msg.level, `${msg.timestamp} - ${msg.level}: ${msg.message}`)),
  ),
  transports: [
    new winston.transports.Console({
      level: 'debug',
      // format: winston.format.combine(winston.format.colorize(), alignColorsAndTime),
      prettyPrint: true,
      colorize: true,
      timestamp: true,
    }),
  ],
});

export default logger;
