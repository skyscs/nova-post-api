import { PoolClient } from 'pg';
import { db } from '../utils/database.js';
import { Division, Country, City, SearchParams, NearbyDivision } from '../types/index.js';

export class DivisionService {
  async createDivision(division: Omit<Division, 'id'>): Promise<Division> {
    const query = `
      INSERT INTO divisions (
        nova_id, name, country, country_code, city, address, 
        phone, email, working_hours, latitude, longitude, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    
    const values = [
      division.nova_id,
      division.name,
      division.country,
      division.country_code,
      division.city,
      division.address,
      division.phone,
      division.email,
      division.working_hours,
      division.latitude,
      division.longitude,
      division.metadata ? JSON.stringify(division.metadata) : null
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  async bulkCreateDivisions(divisions: Omit<Division, 'id'>[]): Promise<void> {
    await db.transaction(async (client: PoolClient) => {
      // Clear existing data
      await client.query('TRUNCATE TABLE divisions CASCADE');
      
      // Batch insert divisions
      const batchSize = 1000;
      for (let i = 0; i < divisions.length; i += batchSize) {
        const batch = divisions.slice(i, i + batchSize);
        const values: any[] = [];
        const placeholders: string[] = [];
        
        batch.forEach((division, index) => {
          const offset = index * 12;
          values.push(
            division.nova_id,
            division.name,
            division.country,
            division.country_code,
            division.city,
            division.address,
            division.phone,
            division.email,
            division.working_hours,
            division.latitude,
            division.longitude,
            division.metadata ? JSON.stringify(division.metadata) : null
          );
          placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12})`);
        });

        const query = `
          INSERT INTO divisions (
            nova_id, name, country, country_code, city, address, 
            phone, email, working_hours, latitude, longitude, metadata
          ) VALUES ${placeholders.join(', ')}
        `;
        
        await client.query(query, values);
      }

      // Update countries table
      await client.query(`
        INSERT INTO countries (name, code, divisions_count)
        SELECT country, country_code, COUNT(*)
        FROM divisions
        GROUP BY country, country_code
        ON CONFLICT (name) DO UPDATE SET
          divisions_count = EXCLUDED.divisions_count
      `);

      // Update cities table
      await client.query(`
        INSERT INTO cities (name, country, country_code, divisions_count)
        SELECT city, country, country_code, COUNT(*)
        FROM divisions
        GROUP BY city, country, country_code
        ON CONFLICT (name, country_code) DO UPDATE SET
          divisions_count = EXCLUDED.divisions_count
      `);
    });
  }

  async findNearbyDivisions(params: SearchParams): Promise<NearbyDivision[]> {
    let query = `
      SELECT *,
      ${params.latitude && params.longitude ? 
        `ST_Distance(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)) * 111.32 as distance` :
        'NULL as distance'
      }
      FROM divisions
      WHERE 1=1
    `;
    
    const values: any[] = [];
    let paramCount = 0;

    if (params.latitude && params.longitude) {
      values.push(params.longitude, params.latitude);
      paramCount += 2;
      
      if (params.radius) {
        query += ` AND ST_DWithin(location, ST_SetSRID(ST_MakePoint($1, $2), 4326), $${paramCount + 1} / 111.32)`;
        values.push(params.radius);
        paramCount++;
      }
    }

    if (params.country) {
      query += ` AND country_code = $${paramCount + 1}`;
      values.push(params.country);
      paramCount++;
    }

    if (params.city) {
      query += ` AND city ILIKE $${paramCount + 1}`;
      values.push(`%${params.city}%`);
      paramCount++;
    }

    if (params.latitude && params.longitude) {
      query += ` ORDER BY distance`;
    } else {
      query += ` ORDER BY name`;
    }

    if (params.limit) {
      query += ` LIMIT $${paramCount + 1}`;
      values.push(params.limit);
      paramCount++;
    }

    if (params.offset) {
      query += ` OFFSET $${paramCount + 1}`;
      values.push(params.offset);
    }

    const result = await db.query(query, values);
    return result.rows;
  }

  async getAllCountries(): Promise<Country[]> {
    const query = 'SELECT * FROM countries ORDER BY name';
    const result = await db.query(query);
    return result.rows;
  }

  async getCitiesByCountry(countryCode: string): Promise<City[]> {
    const query = 'SELECT * FROM cities WHERE country_code = $1 ORDER BY name';
    const result = await db.query(query, [countryCode]);
    return result.rows;
  }

  async getDivisionsByCity(city: string, countryCode: string): Promise<Division[]> {
    const query = 'SELECT * FROM divisions WHERE city = $1 AND country_code = $2 ORDER BY name';
    const result = await db.query(query, [city, countryCode]);
    return result.rows;
  }

  async getDivisionById(id: number): Promise<Division | null> {
    const query = 'SELECT * FROM divisions WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  async getDivisionByNovaId(novaId: string): Promise<Division | null> {
    const query = 'SELECT * FROM divisions WHERE nova_id = $1';
    const result = await db.query(query, [novaId]);
    return result.rows[0] || null;
  }

  async getTotalCount(): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM divisions';
    const result = await db.query(query);
    return parseInt(result.rows[0].count);
  }

  async findDivisionsByCity(cityName: string, params?: { limit?: number; offset?: number }): Promise<Division[]> {
    let query = `
      SELECT d.*, c.name as city_name, c.country_code
      FROM divisions d
      JOIN cities c ON d.city_id = c.id
      WHERE c.name ILIKE $1
      ORDER BY d.name
    `;
    
    const values: any[] = [`%${cityName}%`];
    let paramCount = 1;

    if (params?.limit) {
      query += ` LIMIT $${paramCount + 1}`;
      values.push(params.limit);
      paramCount++;
    }

    if (params?.offset) {
      query += ` OFFSET $${paramCount + 1}`;
      values.push(params.offset);
    }

    const result = await db.query(query, values);
    return result.rows;
  }
} 