import { Hono } from 'hono';
import { logger } from '../utils/logger';
import { db } from '../utils/database';
import { UpdateService } from '../services/updateService';

const system = new Hono();
const updateService = new UpdateService();

// Health check
system.get('/health', (c) => {
  return c.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// System status
system.get('/status', async (c) => {
  try {
    const [divisionsResult, countriesResult, citiesResult] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM divisions'),
      db.query('SELECT COUNT(*) as count FROM countries'),  
      db.query('SELECT COUNT(*) as count FROM cities')
    ]);

    return c.json({
      status: 'OK',
      database: {
        divisions: parseInt(divisionsResult.rows[0].count),
        countries: parseInt(countriesResult.rows[0].count),
        cities: parseInt(citiesResult.rows[0].count)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Status check failed:', error);
    return c.json({ 
      status: 'ERROR', 
      error: 'Database connection failed' 
    }, 500);
  }
});

// Get update status  
system.get('/update-status', async (c) => {
  try {
    const status = await updateService.getUpdateStatus();
    return c.json(status);
  } catch (error) {
    logger.error('Failed to get update status:', error);
    return c.json({ 
      error: 'Failed to get update status' 
    }, 500);
  }
});

// Get update history
system.get('/updates/history', async (c) => {
  try {
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : 10;
    const history = await updateService.getUpdateHistory(limit);

    return c.json({
      success: true,
      data: history
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// REMOVED UNSAFE PUBLIC ENDPOINTS:
// - POST /update (manual update trigger)
// - POST /load-data (load from file)  
// - POST /update-from-api (update from NovaPost API)
// 
// These operations are now only available via:
// 1. Automatic cron job (daily at 03:00)
// 2. CLI commands (run directly on server)

export default system; 