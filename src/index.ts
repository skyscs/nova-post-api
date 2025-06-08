import 'dotenv/config';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import cron from 'node-cron';
import divisionsRouter from './routes/divisions.js';
import systemRouter from './routes/system.js';
import docsRouter from './routes/docs.js';
import parentRegionsRouter from './routes/parentRegions.js';
import citiesRouter from './routes/cities.js';
import { UpdateService } from './services/updateService.js';
import { MigrationManager } from './database/migrations.js';
import { db } from './utils/database.js';
import { logger as appLogger } from './utils/logger.js';

const app = new Hono();

// Middleware
app.use('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'https://ukrpop.com'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.use('*', logger());

// Routes
app.route('/api/v1/divisions', divisionsRouter);
app.route('/api/v1/system', systemRouter);
app.route('/api/v1/docs', docsRouter);
app.route('/api/v1/parent-regions', parentRegionsRouter);
app.route('/api/v1/cities', citiesRouter);

// Root endpoint
app.get('/', (c) => {
  return c.json({
    name: 'NovaPost Divisions API',
    version: '1.0.0',
    description: 'API for NovaPost divisions with geospatial search capabilities',
    endpoints: {
      divisions: '/api/v1/divisions',
      system: '/api/v1/system',
      docs: '/api/v1/docs',
      parent_regions: '/api/v1/parent-regions',
      cities: '/api/v1/cities'
    },
    documentation: {
      swagger: '/api/v1/docs/swagger',
      openapi_json: '/api/v1/docs/openapi.json',
      openapi_yaml: '/api/v1/docs/openapi.yaml'
    }
  });
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Error handler
app.onError((err, c) => {
  appLogger.error('Unhandled error:', err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

// Initialize services
const updateService = new UpdateService();

// Setup cron job for daily updates from NovaPost API
const cronExpression = process.env.UPDATE_CRON || '0 2 * * *'; // Daily at 2 AM
cron.schedule(cronExpression, async () => {
  appLogger.info('Starting scheduled database update from NovaPost API');
  try {
    const updated = await updateService.checkForUpdates();
    if (updated) {
      appLogger.info('Database updated successfully from NovaPost API');
    } else {
      appLogger.error('Database update from NovaPost API failed - check logs');
    }
  } catch (error) {
    appLogger.error('Cron job failed:', error);
  }
});

// Start server
const port = parseInt(process.env.PORT || '3001');

async function startServer() {
  try {
    // Test database connection
    const dbConnected = await db.testConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }
    
    appLogger.info('Database connection successful');

    // Run database migrations
    const migrationManager = new MigrationManager();
    await migrationManager.runMigrations();

    // Start server
    serve({
      fetch: app.fetch,
      port: port,
    });

    appLogger.info(`Server is running on port ${port}`);
    appLogger.info(`API available at http://localhost:${port}`);
    appLogger.info(`Health check: http://localhost:${port}/api/v1/system/health`);
    
    // Perform initial update check
    setTimeout(async () => {
      try {
        appLogger.info('Performing initial update check...');
        const updated = await updateService.checkForUpdates();
        if (updated) {
          appLogger.info('Initial database update completed');
        } else {
          appLogger.info('Database is up to date');
        }
      } catch (error) {
        appLogger.warn('Initial update check failed, will retry on next cron run:', error);
      }
    }, 5000); // Wait 5 seconds after server start

  } catch (error) {
    appLogger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  appLogger.info('Received SIGINT, shutting down gracefully...');
  await db.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  appLogger.info('Received SIGTERM, shutting down gracefully...');
  await db.close();
  process.exit(0);
});

startServer(); 