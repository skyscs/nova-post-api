import { PoolClient } from 'pg';
import { db } from '../utils/database.js';
import { Division, Country, City, SearchParams, NearbyDivision } from '../types/index.js';

export class DivisionService {
  private readonly divisionFields = `
    id, nova_id, name, short_name, external_id, source, country_code, city_id, address, 
    display_address, number, status, customer_service_available, division_category,
    payment_enabled_delivery, payment_enabled_pickup, responsible_person, latitude, longitude,
    long_term_location, max_weight_place_sender, max_length_place_sender, max_width_place_sender,
    max_height_place_sender, max_weight_place_recipient, max_length_place_recipient, max_width_place_recipient,
    max_height_place_recipient, prohibited_sending, prohibited_issuance, max_cost_place, max_declared_cost_place,
    work_schedule, full_address, settings, additional_ids, photos, attributes, nova_created_at, nova_updated_at, nova_deleted_at
  `;



  async bulkCreateDivisions(divisions: any[]): Promise<void> {
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
            division.country_code,
            division.city_id,
            division.address,
            division.latitude,
            division.longitude,
            division.work_schedule ? JSON.stringify(division.work_schedule) : null,
            division.full_address ? JSON.stringify(division.full_address) : null,
            division.settings ? JSON.stringify(division.settings) : null,
            division.additional_ids ? JSON.stringify(division.additional_ids) : null,
            division.photos ? JSON.stringify(division.photos) : null
          );
          placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12})`);
        });

        const query = `
          INSERT INTO divisions (
            nova_id, name, country_code, city_id, address, latitude, longitude,
            work_schedule, full_address, settings, additional_ids, photos
          ) VALUES ${placeholders.join(', ')}
        `;
        
        await client.query(query, values);
      }
    });
  }

  async findNearbyDivisions(params: SearchParams): Promise<NearbyDivision[]> {
    let query = `
      SELECT ${this.divisionFields},
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
      query += ` AND city_id IN (SELECT id FROM cities WHERE name ILIKE $${paramCount + 1})`;
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
    const query = `
      SELECT c.code, c.name, COUNT(d.id) as divisions_count 
      FROM countries c 
      LEFT JOIN divisions d ON c.code = d.country_code 
      GROUP BY c.code, c.name 
      ORDER BY c.name
    `;
    const result = await db.query(query);
    return result.rows;
  }

  async getCitiesByCountry(countryCode: string): Promise<City[]> {
    const query = `
      SELECT c.id, c.nova_id, c.name, c.country_code, c.region_name, c.parent_region_name, COUNT(d.id) as divisions_count 
      FROM cities c 
      LEFT JOIN divisions d ON c.id = d.city_id 
      WHERE c.country_code = $1 
      GROUP BY c.id, c.nova_id, c.name, c.country_code, c.region_name, c.parent_region_name 
      ORDER BY c.name
    `;
    const result = await db.query(query, [countryCode]);
    return result.rows;
  }

  async getDivisionsByCity(cityId: number): Promise<Division[]> {
    const query = `SELECT ${this.divisionFields} FROM divisions WHERE city_id = $1 ORDER BY name`;
    const result = await db.query(query, [cityId]);
    return result.rows;
  }

  async getDivisionById(id: number): Promise<Division | null> {
    const query = `SELECT ${this.divisionFields} FROM divisions WHERE id = $1`;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  async getDivisionByNovaId(novaId: string): Promise<Division | null> {
    const query = `SELECT ${this.divisionFields} FROM divisions WHERE nova_id = $1`;
    const result = await db.query(query, [novaId]);
    return result.rows[0] || null;
  }

  async getTotalCount(): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM divisions';
    const result = await db.query(query);
    return parseInt(result.rows[0].count);
  }

  async searchDivisions(params: SearchParams): Promise<Division[]> {
    let query = `SELECT ${this.divisionFields} FROM divisions WHERE 1=1`;
    const values: any[] = [];
    let paramCount = 0;

    if (params.country) {
      query += ` AND country_code = $${paramCount + 1}`;
      values.push(params.country);
      paramCount++;
    }

    if (params.city) {
      query += ` AND city_id IN (SELECT id FROM cities WHERE name ILIKE $${paramCount + 1})`;
      values.push(`%${params.city}%`);
      paramCount++;
    }

    query += ` ORDER BY name`;

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
} 