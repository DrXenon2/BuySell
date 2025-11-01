const winston = require('winston');
const path = require('path');
const config = require('../config');

// Couleurs pour les logs
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Format personnalisé
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Transport pour la console
const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize({ all: true }),
    logFormat
  ),
  level: config.env === 'development' ? 'debug' : 'info'
});

// Transport pour les fichiers
const fileTransport = new winston.transports.File({
  filename: path.join(config.logging.directory, 'error.log'),
  level: 'error',
  format: logFormat,
  maxsize: 5242880, // 5MB
  maxFiles: 5,
});

const combinedTransport = new winston.transports.File({
  filename: path.join(config.logging.directory, 'combined.log'),
  format: logFormat,
  maxsize: 5242880, // 5MB
  maxFiles: 5,
});

// Création du logger
const logger = winston.createLogger({
  level: config.logging.level,
  defaultMeta: {
    service: config.app.name,
    environment: config.env
  },
  transports: [
    consoleTransport,
    fileTransport,
    combinedTransport
  ],
  exceptionHandlers: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ 
      filename: path.join(config.logging.directory, 'exceptions.log') 
    })
  ],
  rejectionHandlers: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ 
      filename: path.join(config.logging.directory, 'rejections.log') 
    })
  ]
});

// Stream pour Morgan (middleware HTTP logging)
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

module.exports = logger;
