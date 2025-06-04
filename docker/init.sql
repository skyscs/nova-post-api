-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Create database schema
CREATE TABLE IF NOT EXISTS divisions (
    id SERIAL PRIMARY KEY,
    nova_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    country_code VARCHAR(3) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(100),
    working_hours TEXT,
    location GEOMETRY(POINT, 4326),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_divisions_country ON divisions(country);
CREATE INDEX IF NOT EXISTS idx_divisions_city ON divisions(city);
CREATE INDEX IF NOT EXISTS idx_divisions_nova_id ON divisions(nova_id);
CREATE INDEX IF NOT EXISTS idx_divisions_location ON divisions USING GIST(location);

-- Create countries table for fast lookup
CREATE TABLE IF NOT EXISTS countries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(3) UNIQUE NOT NULL,
    divisions_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create cities table for fast lookup
CREATE TABLE IF NOT EXISTS cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    country_code VARCHAR(3) NOT NULL,
    divisions_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(name, country_code)
);

-- Create update log table
CREATE TABLE IF NOT EXISTS update_logs (
    id SERIAL PRIMARY KEY,
    status VARCHAR(20) NOT NULL,
    message TEXT,
    divisions_count INTEGER,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    error_details TEXT
);

-- Create function to update location geometry from lat/lng
CREATE OR REPLACE FUNCTION update_location_geometry()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    END IF;
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update geometry
DROP TRIGGER IF EXISTS trigger_update_location ON divisions;
CREATE TRIGGER trigger_update_location
    BEFORE INSERT OR UPDATE ON divisions
    FOR EACH ROW EXECUTE FUNCTION update_location_geometry(); 