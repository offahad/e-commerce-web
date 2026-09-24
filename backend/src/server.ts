import { createApp } from './app.js';
import { config } from './config/index.js';
import { initDatabase } from './database/index.js';
import { logger } from './common/middleware/request-logger.js';

async function bootstrap() {
  try {
    logger.info('Initializing Liton Brothers database schema and seeds...');
    await initDatabase();
    logger.info('Database initialized successfully.');

    const app = createApp();
    const server = app.listen(config.PORT, '0.0.0.0', () => {
      logger.info(`=======================================================`);
      logger.info(`  LITON BROTHERS — E-COMMERCE BACKEND API SERVICE      `);
      logger.info(`  Environment: ${config.NODE_ENV}                     `);
      logger.info(`  Port:        ${config.PORT}                         `);
      logger.info(`  API v1:      http://0.0.0.0:${config.PORT}/api/v1   `);
      logger.info(`  Swagger UI:  http://0.0.0.0:${config.PORT}/api/docs `);
      logger.info(`=======================================================`);
    });

    // Graceful Shutdown
    const handleShutdown = (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (err: any) {
    logger.error('Failed to start server:', { message: err.message, stack: err.stack });
    process.exit(1);
  }
}

bootstrap();
