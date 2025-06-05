-- Migration: Create parent_regions table
-- This table will store unique parent regions (like voivodeships, oblasts, etc.)

CREATE TABLE IF NOT EXISTS parent_regions (
    id SERIAL PRIMARY KEY,
    nova_id INTEGER UNIQUE,
    name VARCHAR(255) NOT NULL,
    country_code VARCHAR(2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_parent_regions_country_code ON parent_regions(country_code);
CREATE INDEX IF NOT EXISTS idx_parent_regions_name ON parent_regions(name);
CREATE INDEX IF NOT EXISTS idx_parent_regions_nova_id ON parent_regions(nova_id);

-- Add foreign key to cities table
ALTER TABLE cities ADD COLUMN IF NOT EXISTS parent_region_id INTEGER;
ALTER TABLE cities ADD CONSTRAINT IF NOT EXISTS fk_cities_parent_region 
    FOREIGN KEY (parent_region_id) REFERENCES parent_regions(id);

-- Add index for the foreign key
CREATE INDEX IF NOT EXISTS idx_cities_parent_region_id ON cities(parent_region_id); 