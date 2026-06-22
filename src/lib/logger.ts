import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    // In production, you might add a file transport or a cloud-specific transport (e.g., Winston CloudWatch)
  ],
});

export default logger;
