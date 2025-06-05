import { Hono } from 'hono';
import { DivisionService } from '../services/divisionService.js';
import { ApiResponse, SearchParams } from '../types/index.js';

const app = new Hono();
const divisionService = new DivisionService();

// Get nearby divisions
app.get('/nearby', async (c) => {
  try {
    const params: SearchParams = {
      latitude: c.req.query('lat') ? parseFloat(c.req.query('lat')!) : undefined,
      longitude: c.req.query('lng') ? parseFloat(c.req.query('lng')!) : undefined,
      radius: c.req.query('radius') ? parseFloat(c.req.query('radius')!) : undefined,
      country: c.req.query('country') || undefined,
      city: c.req.query('city') || undefined,
      limit: c.req.query('limit') ? parseInt(c.req.query('limit')!) : 50,
      offset: c.req.query('offset') ? parseInt(c.req.query('offset')!) : 0,
    };

    const divisions = await divisionService.findNearbyDivisions(params);
    const total = await divisionService.getTotalCount();

    const response: ApiResponse<typeof divisions> = {
      success: true,
      data: divisions,
      pagination: {
        page: Math.floor((params.offset || 0) / (params.limit || 50)) + 1,
        limit: params.limit || 50,
        total,
        totalPages: Math.ceil(total / (params.limit || 50))
      }
    };

    return c.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    return c.json(response, 500);
  }
});

// Search divisions by city name
app.get('/search', async (c) => {
  try {
    const cityName = c.req.query('city');
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : 50;
    const offset = c.req.query('offset') ? parseInt(c.req.query('offset')!) : 0;

    if (!cityName) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'City name is required'
      };
      return c.json(response, 400);
    }

    const divisions = await divisionService.searchDivisions({ city: cityName, limit, offset });

    const response: ApiResponse<typeof divisions> = {
      success: true,
      data: divisions,
      pagination: {
        page: Math.floor(offset / limit) + 1,
        limit,
        total: divisions.length, // This is approximate, we could add a count method if needed
        totalPages: Math.ceil(divisions.length / limit)
      }
    };

    return c.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    return c.json(response, 500);
  }
});

// Get all countries
app.get('/countries', async (c) => {
  try {
    const countries = await divisionService.getAllCountries();

    const response: ApiResponse<typeof countries> = {
      success: true,
      data: countries
    };

    return c.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    return c.json(response, 500);
  }
});

// Get cities by country code
app.get('/cities', async (c) => {
  try {
    const countryCode = c.req.query('country');
    
    if (!countryCode) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Country code is required'
      };
      return c.json(response, 400);
    }

    const cities = await divisionService.getCitiesByCountry(countryCode);

    const response: ApiResponse<typeof cities> = {
      success: true,
      data: cities
    };

    return c.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    return c.json(response, 500);
  }
});

// Get cities by country (legacy endpoint)
app.get('/countries/:code/cities', async (c) => {
  try {
    const countryCode = c.req.param('code');
    const cities = await divisionService.getCitiesByCountry(countryCode);

    const response: ApiResponse<typeof cities> = {
      success: true,
      data: cities
    };

    return c.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    return c.json(response, 500);
  }
});

// Get divisions by city
app.get('/cities/:city/:countryCode/divisions', async (c) => {
  try {
    const city = c.req.param('city');
    const countryCode = c.req.param('countryCode');
    const divisions = await divisionService.getDivisionsByCity(city, countryCode);

    const response: ApiResponse<typeof divisions> = {
      success: true,
      data: divisions
    };

    return c.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    return c.json(response, 500);
  }
});

// Get division by ID (last to avoid conflicts)
app.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const division = await divisionService.getDivisionById(id);

    if (!division) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Division not found'
      };
      return c.json(response, 404);
    }

    const response: ApiResponse<typeof division> = {
      success: true,
      data: division
    };

    return c.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    return c.json(response, 500);
  }
});

export default app; 