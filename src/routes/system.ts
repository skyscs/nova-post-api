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

// Load data from file
system.post('/load-data', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const filePath = body.filePath || './data-example.json';
    
    logger.info(`Starting data load from file: ${filePath}`);
    
    const result = await updateService.updateFromFile(filePath);
    
    if (result.success) {
      return c.json({
        success: true,
        message: result.message,
        stats: result.stats
      });
    } else {
      return c.json({
        success: false,
        message: result.message
      }, 500);
    }
  } catch (error) {
    const message = `Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`;
    logger.error(message);
    return c.json({
      success: false,
      message
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

// Manual update trigger
system.post('/update', async (c) => {
  try {
    const updated = await updateService.checkForUpdates();
    
    return c.json({
      success: true,
      data: {
        updated,
        message: updated ? 'Database updated successfully' : 'No updates available'
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
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

// Update from NovaPost API
system.post('/update-from-api', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const limit = body.limit; // No default limit - load everything if not specified
    
    logger.info(`Starting data update from NovaPost API with limit: ${limit}`);
    
    const result = await updateService.updateFromApi(limit);
    
    if (result.success) {
      return c.json({
        success: true,
        message: result.message,
        stats: result.stats
      });
    } else {
      return c.json({
        success: false,
        message: result.message
      }, 500);
    }
  } catch (error) {
    const message = `Failed to update from API: ${error instanceof Error ? error.message : 'Unknown error'}`;
    logger.error(message);
    return c.json({
      success: false,
      message
    }, 500);
  }
});

export default system; 