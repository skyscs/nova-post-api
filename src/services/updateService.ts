import axios from 'axios';
import { db } from '../utils/database';
import { DivisionService } from './divisionService.js';
import { Division, UpdateLog, NovaPostApiResponse, NovaPostDivision } from '../types/index.js';
import { logger } from '../utils/logger';
import fs from 'fs/promises';
import path from 'path';
import zlib from 'zlib';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';

// Define the correct structure for the JSON file
interface DataFile {
  items: NovaPostDivision[];
}

export class UpdateService {
  private divisionService: DivisionService;
  private readonly NOVA_POST_VERSIONS_URL = process.env.NOVA_POST_API_URL || 'https://api-cdn.novapost.pl/dictionary/divisions/mobile/full/en/versions.json';
  private readonly DATA_FILE_PATH = path.join(process.cwd(), 'data', 'divisions.json');

  constructor() {
    this.divisionService = new DivisionService();
  }

  async checkForUpdates(): Promise<boolean> {
    try {
      const response = await axios.get<NovaPostApiResponse>(
        process.env.NOVA_POST_API_URL!,
        { timeout: 30000 }
      );

      const apiData = response.data;
      
      if (!apiData.base_version) {
        throw new Error('No base version available');
      }

      // Use the latest delta or base version
      const latestVersion = apiData.deltas.length > 0 
        ? apiData.deltas[apiData.deltas.length - 1]
        : apiData.base_version;

      const lastUpdate = await this.getLastSuccessfulUpdate();

      // Check if we have a newer version
      const latestTimestamp = 'unix_time_till' in latestVersion 
        ? latestVersion.unix_time_till 
        : latestVersion.unix_time;

      if (!lastUpdate || latestTimestamp > (lastUpdate.completed_at?.getTime() || 0) / 1000) {
        await this.updateDatabase(latestVersion.url);
        return true;
      }

      return false;
    } catch (error) {
      await this.logUpdate('failed', 'Failed to check for updates', 0, error);
      throw error;
    }
  }

  private async updateDatabase(dataUrl: string): Promise<void> {
    const startTime = new Date();
    
    try {
      await this.logUpdate('started', 'Starting database update', 0);

      // Download the data
      const response = await axios.get(dataUrl, { 
        timeout: 300000, // 5 minutes timeout for large file
        maxContentLength: 1024 * 1024 * 1024 // 1GB max size
      });

      const divisions = this.parseDivisionData(response.data);
      
      // Bulk insert divisions
      await this.divisionService.bulkCreateDivisions(divisions);
      
      await this.logUpdate('completed', 'Database update completed successfully', divisions.length, null, startTime);
    } catch (error) {
      await this.logUpdate('failed', 'Database update failed', 0, error, startTime);
      throw error;
    }
  }

  private parseDivisionData(data: any): Omit<Division, 'id'>[] {
    const divisions: Omit<Division, 'id'>[] = [];
    
    // The structure might vary, this is a generic parser
    // You may need to adjust this based on the actual API response structure
    if (Array.isArray(data)) {
      data.forEach((item: any) => {
        const division = this.mapApiDataToDivision(item);
        if (division) {
          divisions.push(division);
        }
      });
    } else if (data.data && Array.isArray(data.data)) {
      data.data.forEach((item: any) => {
        const division = this.mapApiDataToDivision(item);
        if (division) {
          divisions.push(division);
        }
      });
    } else if (typeof data === 'object') {
      // Handle nested structure
      Object.values(data).forEach((value: any) => {
        if (Array.isArray(value)) {
          value.forEach((item: any) => {
            const division = this.mapApiDataToDivision(item);
            if (division) {
              divisions.push(division);
            }
          });
        }
      });
    }

    return divisions;
  }

  private mapApiDataToDivision(item: any): Omit<Division, 'id'> | null {
    try {
      // Map API fields to our division structure
      // Adjust field mapping based on actual API response
      return {
        nova_id: item.id || item.division_id || item.code || String(Math.random()),
        name: item.name || item.title || item.division_name || 'Unknown',
        country_code: item.country?.code || item.country_code || 'XX',
        city: item.city?.name || item.city || item.location?.city || 'Unknown',
        address: item.address || item.full_address || item.location?.address,
        phone: item.phone || item.contact?.phone,
        email: item.email || item.contact?.email,
        working_hours: item.working_hours || item.schedule,
        latitude: this.parseCoordinate(item.latitude || item.lat || item.location?.latitude),
        longitude: this.parseCoordinate(item.longitude || item.lng || item.location?.longitude),
        metadata: {
          original_data: item,
          services: item.services || [],
          additional_info: item.additional_info || {}
        }
      };
    } catch (error) {
      console.warn('Failed to parse division data:', error, item);
      return null;
    }
  }

  private parseCoordinate(value: any): number | undefined {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
  }

  private async logUpdate(
    status: 'started' | 'completed' | 'failed',
    message: string,
    divisionsCount: number,
    error?: any,
    startTime?: Date
  ): Promise<void> {
    const log: Partial<UpdateLog> = {
      status,
      message,
      divisions_count: divisionsCount,
      started_at: startTime || new Date(),
      completed_at: status !== 'started' ? new Date() : undefined,
      error_details: error ? JSON.stringify(error, Object.getOwnPropertyNames(error)) : undefined
    };

    const query = `
      INSERT INTO update_logs (status, message, divisions_count, started_at, completed_at, error_details)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    
    await db.query(query, [
      log.status,
      log.message,
      log.divisions_count,
      log.started_at,
      log.completed_at,
      log.error_details
    ]);
  }

  private async getLastSuccessfulUpdate(): Promise<UpdateLog | null> {
    const query = `
      SELECT * FROM update_logs 
      WHERE status = 'completed' 
      ORDER BY completed_at DESC 
      LIMIT 1
    `;
    
    const result = await db.query(query);
    return result.rows[0] || null;
  }

  async getUpdateHistory(limit: number = 10): Promise<UpdateLog[]> {
    const query = `
      SELECT id, status, message, divisions_count, started_at, completed_at, error_details 
      FROM update_logs 
      ORDER BY started_at DESC 
      LIMIT $1
    `;
    
    const result = await db.query(query, [limit]);
    return result.rows;
  }

  async getLastUpdate(): Promise<UpdateLog | null> {
    const query = `
      SELECT id, status, message, divisions_count, started_at, completed_at, error_details 
      FROM update_logs 
      ORDER BY started_at DESC 
      LIMIT 1
    `;
    
    const result = await db.query(query);
    return result.rows[0] || null;
  }

  async updateFromFile(filePath?: string): Promise<{ success: boolean; message: string; stats?: any }> {
    const targetPath = filePath || this.DATA_FILE_PATH;
    
    try {
      logger.info(`Starting data update from file: ${targetPath}`);
      
      // Check if file exists
      try {
        await fs.access(targetPath);
      } catch {
        throw new Error(`File not found: ${targetPath}`);
      }

      // Check file size to determine parsing strategy
      const fileStats = await fs.stat(targetPath);
      const fileSizeMB = fileStats.size / (1024 * 1024);
      
      logger.info(`File size: ${fileSizeMB.toFixed(2)} MB`);

      if (fileSizeMB > 100) { // Use streaming for files larger than 100MB
        return await this.updateFromLargeFile(targetPath);
      } else {
        return await this.updateFromSmallFile(targetPath);
      }

    } catch (error) {
      const message = `Failed to update from file: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error(message);
      return { success: false, message };
    }
  }

  private async updateFromSmallFile(targetPath: string): Promise<{ success: boolean; message: string; stats?: any }> {
    // Read and parse JSON file normally
    const fileContent = await fs.readFile(targetPath, 'utf-8');
    const data: DataFile = JSON.parse(fileContent);

    if (!data.items || !Array.isArray(data.items)) {
      throw new Error('Invalid data format: missing items array');
    }

    logger.info(`Found ${data.items.length} divisions in file`);

    // Process data in batches
    const batchSize = 10;
    const stats = {
      total: data.items.length,
      processed: 0,
      countries: new Set<string>(),
      cities: new Set<string>(),
      errors: 0
    };

    for (let i = 0; i < data.items.length; i += batchSize) {
      const batch = data.items.slice(i, i + batchSize);
      await this.processBatch(batch, stats);
      logger.info(`Processed ${Math.min(i + batchSize, data.items.length)}/${data.items.length} divisions`);
    }

    const message = `Successfully loaded ${stats.processed} divisions from ${stats.countries.size} countries and ${stats.cities.size} cities. Errors: ${stats.errors}`;
    logger.info(message);

    return {
      success: true,
      message,
      stats: {
        total: stats.total,
        processed: stats.processed,
        countries: stats.countries.size,
        cities: stats.cities.size,
        errors: stats.errors
      }
    };
  }

  private async updateFromLargeFile(targetPath: string): Promise<{ success: boolean; message: string; stats?: any }> {
    logger.info('Processing large file in memory with batch processing');
    
    // Read file in chunks to avoid memory issues
    const fileStats = await fs.stat(targetPath);
    const fileSizeMB = fileStats.size / (1024 * 1024);
    
    if (fileSizeMB > 1000) { // If larger than 1GB, refuse to process
      throw new Error(`File too large: ${fileSizeMB.toFixed(2)}MB. Maximum size is 1GB.`);
    }
    
    logger.info(`Loading ${fileSizeMB.toFixed(2)}MB file into memory...`);
    
    // Load and parse the entire file
    const fileContent = await fs.readFile(targetPath, 'utf-8');
    const data: DataFile = JSON.parse(fileContent);

    if (!data.items || !Array.isArray(data.items)) {
      throw new Error('Invalid data format: missing items array');
    }

    logger.info(`Found ${data.items.length} divisions in file`);

    const stats = {
      total: data.items.length,
      processed: 0,
      countries: new Set<string>(),
      cities: new Set<string>(),
      errors: 0
    };

    // Process in larger batches for better performance with large files
    const batchSize = 100;
    
    for (let i = 0; i < data.items.length; i += batchSize) {
      const batch = data.items.slice(i, i + batchSize);
      
      await this.processBatch(batch, stats);
      
      const progress = Math.min(i + batchSize, data.items.length);
      logger.info(`Processed ${progress}/${data.items.length} divisions (${((progress / data.items.length) * 100).toFixed(1)}%)`);
      
      // Small delay to prevent overwhelming the database
      if (i % (batchSize * 10) === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const message = `Successfully loaded ${stats.processed} divisions from ${stats.countries.size} countries and ${stats.cities.size} cities. Errors: ${stats.errors}`;
    logger.info(message);

    return {
      success: true,
      message,
      stats: {
        total: stats.total,
        processed: stats.processed,
        countries: stats.countries.size,
        cities: stats.cities.size,
        errors: stats.errors
      }
    };
  }

  private async processBatch(divisions: NovaPostDivision[], stats: any): Promise<void> {
    for (const division of divisions) {
      try {
        console.log(`Processing division: ${division.id} - ${division.name}`);
        
        // Track countries and cities
        stats.countries.add(division.countryCode);
        stats.cities.add(`${division.settlement.name}-${division.countryCode}`);

        // Process each division in its own transaction
        await db.query('BEGIN');
        console.log('Transaction started');

        // Insert/update country
        await this.upsertCountry(division);
        console.log(`Country upserted: ${division.countryCode}`);
        
        // Insert/update city
        const cityId = await this.upsertCity(division);
        console.log(`City upserted: ${division.settlement.name} (ID: ${cityId})`);
        
        // Insert/update division
        await this.upsertDivision(division, cityId);
        console.log(`Division upserted: ${division.id}`);
        
        await db.query('COMMIT');
        console.log('Transaction committed');
        stats.processed++;
        
        console.log(`Processed ${stats.processed}/${stats.total} divisions`);
        
      } catch (error) {
        console.log('Error occurred, rolling back transaction');
        try {
          await db.query('ROLLBACK');
        } catch (rollbackError) {
          console.log('Rollback error:', rollbackError);
        }
        stats.errors++;
        console.error(`Error processing division ID ${division.id}:`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          division: {
            id: division.id,
            name: division.name,
            countryCode: division.countryCode,
            settlement: division.settlement
          }
        });
      }
    }
  }

  private async upsertCountry(division: NovaPostDivision): Promise<void> {
    const countryName = division.fullAddress?.country || 
                       (division.countryCode === 'UA' ? 'Ukraine' : 
                        division.countryCode === 'PL' ? 'Poland' : division.countryCode);

    await db.query(`
      INSERT INTO countries (code, name, updated_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (code) 
      DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = CURRENT_TIMESTAMP
    `, [division.countryCode, countryName]);
  }

  private async upsertParentRegion(division: NovaPostDivision): Promise<number | null> {
    if (!division.parent?.name) {
      return null;
    }

    // First try to find existing parent region by nova_id
    const existingParentRegion = await db.query(`
      SELECT id FROM parent_regions WHERE nova_id = $1
    `, [division.parent.id]);

    if (existingParentRegion.rows.length > 0) {
      return existingParentRegion.rows[0].id;
    }

    // If not found, insert new parent region
    const result = await db.query(`
      INSERT INTO parent_regions (
        nova_id, name, country_code, updated_at
      )
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      RETURNING id
    `, [
      division.parent.id,
      division.parent.name,
      division.countryCode
    ]);

    return result.rows[0].id;
  }

  private async upsertCity(division: NovaPostDivision): Promise<number> {
    // First upsert parent region if exists
    const parentRegionId = await this.upsertParentRegion(division);

    // Extract region information safely - FIXED: use division.region and division.parent
    const regionName = division.region?.name || null;
    const parentRegionName = division.parent?.name || null;

    // Try to find existing city by nova_id
    const existingCity = await db.query(`
      SELECT id FROM cities WHERE nova_id = $1
    `, [division.settlement.id]);

    if (existingCity.rows.length > 0) {
      // Update existing city with parent_region_id if it's null
      await db.query(`
        UPDATE cities SET 
          region_name = $2,
          parent_region_name = $3,
          parent_region_id = COALESCE(parent_region_id, $4),
          updated_at = CURRENT_TIMESTAMP
        WHERE nova_id = $1
      `, [
        division.settlement.id,
        regionName,
        parentRegionName,
        parentRegionId
      ]);
      
      return existingCity.rows[0].id;
    }

    // If not found, insert new city
    const result = await db.query(`
      INSERT INTO cities (
        nova_id, name, country_code, region_name, parent_region_name, parent_region_id, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING id
    `, [
      division.settlement.id,
      division.settlement.name,
      division.countryCode,
      regionName,
      parentRegionName,
      parentRegionId
    ]);

    return result.rows[0].id;
  }

  private async upsertDivision(division: NovaPostDivision, cityId: number): Promise<void> {
    await db.query(`
      INSERT INTO divisions (
        nova_id, name, short_name, external_id, source, country_code, city_id,
        address, display_address, number, status, customer_service_available,
        division_category, payment_enabled_delivery, payment_enabled_pickup,
        responsible_person, latitude, longitude, location, long_term_location,
        max_weight_place_sender, max_length_place_sender, max_width_place_sender, max_height_place_sender,
        max_weight_place_recipient, max_length_place_recipient, max_width_place_recipient, max_height_place_recipient,
        prohibited_sending, prohibited_issuance, max_cost_place, max_declared_cost_place,
        work_schedule, full_address, settings, additional_ids, photos, attributes,
        nova_created_at, nova_updated_at, nova_deleted_at, updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17::decimal, $18::decimal,
        ST_SetSRID(ST_MakePoint($18::decimal, $17::decimal), 4326), $19, $20, $21, $22, $23, $24, $25, $26, $27,
        $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, CURRENT_TIMESTAMP
      )
      ON CONFLICT (nova_id) 
      DO UPDATE SET 
        name = EXCLUDED.name,
        short_name = EXCLUDED.short_name,
        external_id = EXCLUDED.external_id,
        source = EXCLUDED.source,
        country_code = EXCLUDED.country_code,
        city_id = EXCLUDED.city_id,
        address = EXCLUDED.address,
        display_address = EXCLUDED.display_address,
        number = EXCLUDED.number,
        status = EXCLUDED.status,
        customer_service_available = EXCLUDED.customer_service_available,
        division_category = EXCLUDED.division_category,
        payment_enabled_delivery = EXCLUDED.payment_enabled_delivery,
        payment_enabled_pickup = EXCLUDED.payment_enabled_pickup,
        responsible_person = EXCLUDED.responsible_person,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        location = EXCLUDED.location,
        long_term_location = EXCLUDED.long_term_location,
        max_weight_place_sender = EXCLUDED.max_weight_place_sender,
        max_length_place_sender = EXCLUDED.max_length_place_sender,
        max_width_place_sender = EXCLUDED.max_width_place_sender,
        max_height_place_sender = EXCLUDED.max_height_place_sender,
        max_weight_place_recipient = EXCLUDED.max_weight_place_recipient,
        max_length_place_recipient = EXCLUDED.max_length_place_recipient,
        max_width_place_recipient = EXCLUDED.max_width_place_recipient,
        max_height_place_recipient = EXCLUDED.max_height_place_recipient,
        prohibited_sending = EXCLUDED.prohibited_sending,
        prohibited_issuance = EXCLUDED.prohibited_issuance,
        max_cost_place = EXCLUDED.max_cost_place,
        max_declared_cost_place = EXCLUDED.max_declared_cost_place,
        work_schedule = EXCLUDED.work_schedule,
        full_address = EXCLUDED.full_address,
        settings = EXCLUDED.settings,
        additional_ids = EXCLUDED.additional_ids,
        photos = EXCLUDED.photos,
        attributes = EXCLUDED.attributes,
        nova_created_at = EXCLUDED.nova_created_at,
        nova_updated_at = EXCLUDED.nova_updated_at,
        nova_deleted_at = EXCLUDED.nova_deleted_at,
        updated_at = CURRENT_TIMESTAMP
    `, [
      division.id,                          // $1
      division.name,                        // $2
      division.shortName,                   // $3
      division.externalId,                  // $4
      division.source,                      // $5
      division.countryCode,                 // $6
      cityId,                              // $7
      division.address,                     // $8
      division.displayAddress,              // $9
      division.number,                      // $10
      division.status,                      // $11
      division.customerServiceAvailable,    // $12
      division.divisionCategory,            // $13
      division.paymentEnabledDelivery,      // $14
      division.paymentEnabledPickup,        // $15
      division.responsiblePerson,           // $16
      division.latitude,                    // $17
      division.longitude,                   // $18
      division.longTermLocation,            // $19
      division.maxWeightPlaceSender,        // $20
      division.maxLengthPlaceSender,        // $21
      division.maxWidthPlaceSender,         // $22
      division.maxHeightPlaceSender,        // $23
      division.maxWeightPlaceRecipient,     // $24
      division.maxLengthPlaceRecipient,     // $25
      division.maxWidthPlaceRecipient,      // $26
      division.maxHeightPlaceRecipient,     // $27
      division.prohibitedSending,           // $28
      division.prohibitedIssuance,          // $29
      division.maxCostPlace,                // $30
      division.maxDeclaredCostPlace,        // $31
      JSON.stringify(division.workSchedule), // $32
      JSON.stringify(division.fullAddress),  // $33
      JSON.stringify(division.settings),     // $34
      JSON.stringify(division.additionalIds), // $35
      JSON.stringify(division.photos),       // $36
      JSON.stringify(division.attributes),   // $37
      new Date(division.createdAt),         // $38
      new Date(division.updatedAt),         // $39
      division.deletedAt ? new Date(division.deletedAt) : null // $40
    ]);
  }

  async updateFromApi(limit?: number): Promise<{ success: boolean; message: string; stats?: any }> {
    const startTime = new Date();
    
    try {
      logger.info('Starting data update from NovaPost API');
      
      await this.logUpdate('started', 'Started API update from NovaPost', 0, null, startTime);

      // Get the latest version info
      const versionsResponse = await fetch(this.NOVA_POST_VERSIONS_URL);
      if (!versionsResponse.ok) {
        throw new Error(`Failed to fetch versions: ${versionsResponse.status}`);
      }

      const versionsData: any = await versionsResponse.json();
      const baseUrl = versionsData.base_version.url;
      
      logger.info(`Downloading base data from: ${baseUrl}`);

      // Download and save the compressed file to disk first
      const response = await fetch(baseUrl);
      if (!response.ok) {
        throw new Error(`Failed to download base file: ${response.status}`);
      }

      // Save compressed file to disk
      const tempGzPath = path.join(process.cwd(), 'temp-nova-base.json.gz');
      const tempJsonPath = path.join(process.cwd(), 'temp-nova-base.json');
      
      // Write compressed data to file
      const fileBuffer = Buffer.from(await response.arrayBuffer());
      await fs.writeFile(tempGzPath, fileBuffer);
      
      logger.info('Decompressing file...');
      
      // Decompress file
      const compressedData = await fs.readFile(tempGzPath);
      const decompressedData = zlib.gunzipSync(compressedData);
      await fs.writeFile(tempJsonPath, decompressedData);
      
      // Clean up compressed file
      await fs.unlink(tempGzPath);
      
      logger.info('Starting streaming parse of decompressed data...');

      // Use streaming parser for the large JSON file
      const result = await this.parseApiFileWithLimit(tempJsonPath, limit);
      
      // Clean up temporary file
      await fs.unlink(tempJsonPath);

      const message = `Successfully loaded ${result.stats.processed} divisions from ${result.stats.countries} countries and ${result.stats.cities} cities from NovaPost API. Errors: ${result.stats.errors}`;
      
      await this.logUpdate('completed', message, result.stats.processed, null, startTime);
      logger.info(message);

      return {
        success: true,
        message,
        stats: result.stats
      };

    } catch (error) {
      const errorMessage = `Failed to update from NovaPost API: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      await this.logUpdate('failed', errorMessage, 0, error, startTime);
      logger.error(errorMessage, error);

      return { 
        success: false, 
        message: errorMessage 
      };
    }
  }

  private async parseApiFileWithLimit(filePath: string, limit?: number): Promise<{ stats: any }> {
    logger.info('Parsing API file with in-memory processing');
    
    // Load and parse the entire file
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data: DataFile = JSON.parse(fileContent);

    if (!data.items || !Array.isArray(data.items)) {
      throw new Error('Invalid data format: missing items array');
    }

    let items = data.items;
    
    // Apply limit if specified
    if (limit && items.length > limit) {
      items = items.slice(0, limit);
      logger.info(`Limited to ${limit} divisions from total ${data.items.length}`);
    }

    logger.info(`Processing ${items.length} divisions`);

    const stats = {
      total: items.length,
      processed: 0,
      countries: new Set<string>(),
      cities: new Set<string>(),
      errors: 0
    };

    // Process in batches
    const batchSize = 100;
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      await this.processBatch(batch, stats);
      
      const progress = Math.min(i + batchSize, items.length);
      logger.info(`Processed ${progress}/${items.length} divisions (${((progress / items.length) * 100).toFixed(1)}%)`);
    }

    return {
      stats: {
        total: stats.total,
        processed: stats.processed,
        countries: stats.countries.size,
        cities: stats.cities.size,
        errors: stats.errors
      }
    };
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  private parseWorkSchedule(schedule: any): any[] {
    if (!schedule) {
      return [
        { day: 'monday', from: '09:00', to: '18:00', breakFrom: null, breakTo: null },
        { day: 'tuesday', from: '09:00', to: '18:00', breakFrom: null, breakTo: null },
        { day: 'wednesday', from: '09:00', to: '18:00', breakFrom: null, breakTo: null },
        { day: 'thursday', from: '09:00', to: '18:00', breakFrom: null, breakTo: null },
        { day: 'friday', from: '09:00', to: '18:00', breakFrom: null, breakTo: null },
        { day: 'saturday', from: '09:00', to: '15:00', breakFrom: null, breakTo: null },
        { day: 'sunday', from: '00:00', to: '00:00', breakFrom: null, breakTo: null }
      ];
    }

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayKeys = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    return days.map((day, index) => {
      const daySchedule = schedule[dayKeys[index]] || '09:00-18:00';
      if (daySchedule === '-' || !daySchedule) {
        return { day, from: '00:00', to: '00:00', breakFrom: null, breakTo: null };
      }
      
      const [from, to] = daySchedule.split('-');
      return {
        day,
        from: from || '09:00',
        to: to || '18:00',
        breakFrom: null,
        breakTo: null
      };
    });
  }

  async getUpdateStatus(): Promise<any> {
    try {
      const [divisionsResult, countriesResult, citiesResult] = await Promise.all([
        db.query('SELECT COUNT(*) as count, MAX(updated_at) as last_update FROM divisions'),
        db.query('SELECT COUNT(*) as count FROM countries'),
        db.query('SELECT COUNT(*) as count FROM cities')
      ]);

      return {
        divisions: {
          count: parseInt(divisionsResult.rows[0].count),
          last_update: divisionsResult.rows[0].last_update
        },
        countries: {
          count: parseInt(countriesResult.rows[0].count)
        },
        cities: {
          count: parseInt(citiesResult.rows[0].count)
        }
      };
    } catch (error) {
      logger.error('Error getting update status:', error);
      throw error;
    }
  }

  /**
   * Clear all data from database
   */
  async clearAllData(): Promise<void> {
    logger.info('Starting to clear all data from database');
    
    // Clear data without transaction for more flexibility
    try {
      // Clear in correct order to respect foreign key constraints
      await db.query('DELETE FROM divisions');
      logger.info('Cleared divisions table');
      
      await db.query('DELETE FROM cities');
      logger.info('Cleared cities table');
      
      await db.query('DELETE FROM parent_regions');
      logger.info('Cleared parent_regions table');
      
      await db.query('DELETE FROM countries');
      logger.info('Cleared countries table');
      
      // Try to clear update_history/update_logs if tables exist
      try {
        await db.query('DELETE FROM update_history');
        logger.info('Cleared update_history table');
      } catch (error) {
        logger.warn('update_history table does not exist, skipping...');
      }
      
      try {
        await db.query('DELETE FROM update_logs');
        logger.info('Cleared update_logs table');
      } catch (error) {
        logger.warn('update_logs table does not exist, skipping...');
      }
      
      // Reset sequences (only for existing sequences)
      await db.query('ALTER SEQUENCE divisions_id_seq RESTART WITH 1');
      await db.query('ALTER SEQUENCE cities_id_seq RESTART WITH 1');
      await db.query('ALTER SEQUENCE parent_regions_id_seq RESTART WITH 1');
      
      // Optional sequences that might not exist
      try {
        await db.query('ALTER SEQUENCE update_logs_id_seq RESTART WITH 1');
      } catch (error) {
        logger.warn('update_logs_id_seq sequence does not exist, skipping...');
      }
      
      try {
        await db.query('ALTER SEQUENCE schema_migrations_id_seq RESTART WITH 1');
      } catch (error) {
        logger.warn('schema_migrations_id_seq sequence does not exist, skipping...');
      }
      
      logger.info('All data cleared successfully');
    } catch (error) {
      logger.error('Error clearing data:', error);
      throw error;
    }
  }

  /**
   * Force update: clear all data and download fresh from API
   */
  async forceUpdate(): Promise<{ success: boolean; message: string; stats?: any }> {
    const startTime = new Date();
    
    try {
      logger.info('Starting force update: clearing all data');
      
      await this.logUpdate('started', 'Force update: clearing all data and downloading fresh', 0, null, startTime);
      
      // Clear all existing data
      await this.clearAllData();
      
      // Download and update from API
      const result = await this.updateFromApi();
      
      if (result.success) {
        await this.logUpdate('completed', `Force update completed: ${result.message}`, result.stats?.processed || 0, null, startTime);
        return {
          success: true,
          message: `Force update completed: ${result.message}`,
          stats: result.stats
        };
      } else {
        await this.logUpdate('failed', result.message, 0, null, startTime);
        return result;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.logUpdate('failed', `Force update failed: ${errorMessage}`, 0, error, startTime);
      logger.error('Force update failed:', error);
      return {
        success: false,
        message: `Force update failed: ${errorMessage}`
      };
    }
  }

  /**
   * Force update from API with optional limit: clear all data and download fresh
   */
  async forceUpdateFromApi(limit?: number): Promise<{ success: boolean; message: string; stats?: any }> {
    const startTime = new Date();
    
    try {
      logger.info(`Starting force update from API${limit ? ` with limit ${limit}` : ''}`);
      
      await this.logUpdate('started', `Force update from API with limit: ${limit || 'unlimited'}`, 0, null, startTime);
      
      // Clear all existing data
      await this.clearAllData();
      
      // Download and update from API with limit
      const result = await this.updateFromApi(limit);
      
      if (result.success) {
        await this.logUpdate('completed', `Force update from API completed: ${result.message}`, result.stats?.processed || 0, null, startTime);
        return {
          success: true,
          message: `Force update from API completed: ${result.message}`,
          stats: result.stats
        };
      } else {
        await this.logUpdate('failed', result.message, 0, null, startTime);
        return result;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.logUpdate('failed', `Force update from API failed: ${errorMessage}`, 0, error, startTime);
      logger.error('Force update from API failed:', error);
      return {
        success: false,
        message: `Force update from API failed: ${errorMessage}`
      };
    }
  }
} 