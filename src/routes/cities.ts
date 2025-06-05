import { Hono } from 'hono';
import { DivisionService } from '../services/divisionService';
import { logger } from '../utils/logger';

const cities = new Hono();
const divisionService = new DivisionService();

// Get divisions for a specific city
cities.get('/:id/divisions', async (c) => {
  try {
    const cityId = parseInt(c.req.param('id'));
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : undefined;
    const offset = c.req.query('offset') ? parseInt(c.req.query('offset')!) : undefined;

    if (isNaN(cityId)) {
      return c.json({
        success: false,
        error: 'Invalid city ID'
      }, 400);
    }

    const result = await divisionService.getDivisionsByCity(cityId, {
      limit,
      offset
    });

    return c.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: `Found ${result.data.length} divisions in city ${cityId}`
    });

  } catch (error) {
    logger.error('Error getting divisions by city:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default cities; 