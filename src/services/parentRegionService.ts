import { db } from '../utils/database';
import { ParentRegion } from '../types/division';

export class ParentRegionService {
  /**
   * Get all parent regions for a specific country
   */
  async getParentRegionsByCountry(countryCode: string): Promise<ParentRegion[]> {
    const query = `
      SELECT id, nova_id, name, country_code, created_at, updated_at
      FROM parent_regions
      WHERE country_code = $1
      ORDER BY name ASC
    `;
    
    const result = await db.query(query, [countryCode.toUpperCase()]);
    return result.rows;
  }

  /**
   * Get all parent regions with optional filters
   */
  async getAllParentRegions(params: {
    country?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{
    data: ParentRegion[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> {
    const { country, limit = 50, offset = 0 } = params;
    
    let whereClause = '';
    const queryParams: any[] = [];
    
    if (country) {
      whereClause = 'WHERE country_code = $1';
      queryParams.push(country.toUpperCase());
    }
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM parent_regions ${whereClause}`;
    const countResult = await db.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);
    
    // Get data with pagination
    queryParams.push(limit, offset);
    const limitOffsetParams = country ? '$2, $3' : '$1, $2';
    
    const dataQuery = `
      SELECT id, nova_id, name, country_code, created_at, updated_at
      FROM parent_regions 
      ${whereClause}
      ORDER BY name ASC
      LIMIT ${limitOffsetParams.split(',')[0]} OFFSET ${limitOffsetParams.split(',')[1]}
    `;
    
    const result = await db.query(dataQuery, queryParams);
    
    return {
      data: result.rows,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };
  }

  /**
   * Get parent region statistics by country
   */
  async getParentRegionStats(): Promise<Array<{
    country_code: string;
    count: number;
  }>> {
    const query = `
      SELECT country_code, COUNT(*) as count
      FROM parent_regions
      GROUP BY country_code
      ORDER BY count DESC
    `;
    
    const result = await db.query(query);
    return result.rows.map(row => ({
      country_code: row.country_code,
      count: parseInt(row.count)
    }));
  }

  /**
   * Search parent regions by name
   */
  async searchParentRegions(searchTerm: string, countryCode?: string): Promise<ParentRegion[]> {
    let query = `
      SELECT id, nova_id, name, country_code, created_at, updated_at
      FROM parent_regions
      WHERE name ILIKE $1
    `;
    
    const queryParams: any[] = [`%${searchTerm}%`];
    
    if (countryCode) {
      query += ' AND country_code = $2';
      queryParams.push(countryCode.toUpperCase());
    }
    
    query += ' ORDER BY name ASC LIMIT 20';
    
    const result = await db.query(query, queryParams);
    return result.rows;
  }
} 