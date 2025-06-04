import { db } from '../utils/database.js';
import { logger } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';

export class MigrationManager {
  private migrationsPath: string;

  constructor() {
    // Try different paths for schema.sql
    const possiblePaths = [
      path.join(process.cwd(), 'src', 'database'),
      path.join(process.cwd(), 'dist', 'database'),
      path.join(__dirname, '../database'),
      path.join(__dirname, './'),
    ];
    
    // Find the first path that contains schema.sql
    this.migrationsPath = possiblePaths[0]; // default
    
    for (const testPath of possiblePaths) {
      const schemaPath = path.join(testPath, 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        this.migrationsPath = testPath;
        break;
      }
    }
  }

  /**
   * Run all pending migrations
   */
  async runMigrations(): Promise<void> {
    try {
      logger.info('Starting database migrations...');

      // Create migrations table if it doesn't exist
      await this.createMigrationsTable();

      // Check if we need to run initial schema
      const tablesExist = await this.checkTablesExist();
      
      if (!tablesExist) {
        logger.info('No tables found, running initial schema...');
        await this.runInitialSchema();
        await this.markMigrationAsRun('initial_schema');
      }

      // Add update_logs table if missing
      const updateLogsExists = await this.checkUpdateLogsTable();
      if (!updateLogsExists) {
        logger.info('Creating update_logs table...');
        await this.createUpdateLogsTable();
        await this.markMigrationAsRun('create_update_logs');
      }

      logger.info('Database migrations completed successfully');
    } catch (error) {
      logger.error('Migration failed:', error);
      throw error;
    }
  }

  /**
   * Create migrations tracking table
   */
  private async createMigrationsTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await db.query(query);
  }

  /**
   * Check if core tables exist
   */
  private async checkTablesExist(): Promise<boolean> {
    const query = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'divisions'
      );
    `;
    
    const result = await db.query(query);
    return result.rows[0].exists;
  }

  /**
   * Check if update_logs table exists
   */
  private async checkUpdateLogsTable(): Promise<boolean> {
    const query = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'update_logs'
      );
    `;
    
    const result = await db.query(query);
    return result.rows[0].exists;
  }

  /**
   * Run initial database schema
   */
  private async runInitialSchema(): Promise<void> {
    try {
      const schemaPath = path.join(this.migrationsPath, 'schema.sql');
      
      logger.info(`Reading schema from: ${schemaPath}`);
      
      // Check if file exists
      if (!fs.existsSync(schemaPath)) {
        throw new Error(`Schema file not found at: ${schemaPath}`);
      }
      
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
      logger.info(`Schema file size: ${schemaSql.length} characters`);
      
      // Remove comments and normalize whitespace
      const cleanSql = schemaSql
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('--'))
        .join(' ');
      
      // Split by semicolons and clean up
      const statements = cleanSql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

      logger.info(`Found ${statements.length} SQL statements to execute`);

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i].trim();
        if (statement) {
          try {
            logger.info(`Executing statement ${i + 1}/${statements.length}: ${statement.substring(0, 80)}...`);
            await db.query(statement);
            logger.info(`✅ Statement ${i + 1} executed successfully`);
          } catch (error) {
            logger.error(`❌ Error executing statement ${i + 1}:`, error);
            logger.error(`Failed statement: ${statement}`);
            throw error;
          }
        }
      }
      
      logger.info('✅ Initial schema executed successfully');
    } catch (error) {
      logger.error('❌ Failed to run initial schema:', error);
      throw error;
    }
  }

  /**
   * Create update_logs table
   */
  private async createUpdateLogsTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS update_logs (
        id SERIAL PRIMARY KEY,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        status VARCHAR(20) DEFAULT 'running',
        total_processed INTEGER DEFAULT 0,
        total_inserted INTEGER DEFAULT 0,
        total_updated INTEGER DEFAULT 0,
        error_message TEXT
      );
      
      CREATE INDEX IF NOT EXISTS idx_update_logs_started_at ON update_logs(started_at);
      CREATE INDEX IF NOT EXISTS idx_update_logs_status ON update_logs(status);
    `;
    
    await db.query(query);
  }

  /**
   * Mark migration as completed
   */
  private async markMigrationAsRun(migrationName: string): Promise<void> {
    const query = `
      INSERT INTO schema_migrations (migration_name) 
      VALUES ($1) 
      ON CONFLICT (migration_name) DO NOTHING;
    `;
    
    await db.query(query, [migrationName]);
  }

  /**
   * Check if migration was already run
   */
  private async isMigrationRun(migrationName: string): Promise<boolean> {
    const query = `
      SELECT EXISTS (
        SELECT 1 FROM schema_migrations 
        WHERE migration_name = $1
      );
    `;
    
    const result = await db.query(query, [migrationName]);
    return result.rows[0].exists;
  }
} 