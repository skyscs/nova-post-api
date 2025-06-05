import { Hono } from 'hono';
import { ParentRegionService } from '../services/parentRegionService';
import { DivisionService } from '../services/divisionService';
import { logger } from '../utils/logger';

const parentRegions = new Hono();
const parentRegionService = new ParentRegionService();
const divisionService = new DivisionService();

// Get all parent regions for a specific country
parentRegions.get('/', async (c) => {
  try {
    const country = c.req.query('country');
    const search = c.req.query('search');
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : undefined;
    const offset = c.req.query('offset') ? parseInt(c.req.query('offset')!) : undefined;

    if (search) {
      // Search parent regions by name
      const regions = await parentRegionService.searchParentRegions(search, country);
      return c.json({
        success: true,
        data: regions,
        message: `Found ${regions.length} parent regions matching "${search}"`
      });
    }

    if (country) {
      // Get parent regions for specific country
      const regions = await parentRegionService.getParentRegionsByCountry(country);
      return c.json({
        success: true,
        data: regions,
        message: `Found ${regions.length} parent regions for ${country}`
      });
    }

    // Get all parent regions with pagination
    const result = await parentRegionService.getAllParentRegions({ 
      country, 
      limit, 
      offset 
    });

    return c.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: `Retrieved ${result.data.length} parent regions`
    });

  } catch (error) {
    logger.error('Error getting parent regions:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get parent region statistics
parentRegions.get('/stats', async (c) => {
  try {
    const stats = await parentRegionService.getParentRegionStats();
    return c.json({
      success: true,
      data: stats,
      message: 'Retrieved parent region statistics'
    });
  } catch (error) {
    logger.error('Error getting parent region stats:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get cities for a specific parent region
parentRegions.get('/:id/cities', async (c) => {
  try {
    const parentRegionId = parseInt(c.req.param('id'));
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : undefined;
    const offset = c.req.query('offset') ? parseInt(c.req.query('offset')!) : undefined;

    if (isNaN(parentRegionId)) {
      return c.json({
        success: false,
        error: 'Invalid parent region ID'
      }, 400);
    }

    const result = await divisionService.getCitiesByParentRegion(parentRegionId, {
      limit,
      offset
    });

    return c.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: `Found ${result.data.length} cities in parent region ${parentRegionId}`
    });

  } catch (error) {
    logger.error('Error getting cities by parent region:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default parentRegions; 