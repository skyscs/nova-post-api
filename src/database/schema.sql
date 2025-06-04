-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS divisions CASCADE;
DROP TABLE IF EXISTS countries CASCADE;
DROP TABLE IF EXISTS cities CASCADE;

-- Countries table
CREATE TABLE countries (
    code VARCHAR(2) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    divisions_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cities table
CREATE TABLE cities (
    id SERIAL PRIMARY KEY,
    nova_id INTEGER UNIQUE,
    name VARCHAR(100) NOT NULL,
    country_code VARCHAR(2) REFERENCES countries(code),
    region_name VARCHAR(100),
    parent_region_name VARCHAR(100),
    divisions_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Divisions table with complete NovaPost structure
CREATE TABLE divisions (
    id SERIAL PRIMARY KEY,
    nova_id INTEGER UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(255),
    external_id VARCHAR(255),
    source VARCHAR(50),
    country_code VARCHAR(2) REFERENCES countries(code),
    city_id INTEGER REFERENCES cities(id),
    address TEXT,
    display_address TEXT,
    number VARCHAR(50),
    status VARCHAR(50),
    customer_service_available BOOLEAN DEFAULT false,
    division_category VARCHAR(50),
    payment_enabled_delivery BOOLEAN DEFAULT false,
    payment_enabled_pickup BOOLEAN DEFAULT false,
    responsible_person VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location GEOMETRY(Point, 4326),
    long_term_location BOOLEAN DEFAULT false,
    max_weight_place_sender INTEGER,
    max_length_place_sender INTEGER,
    max_width_place_sender INTEGER,
    max_height_place_sender INTEGER,
    max_weight_place_recipient INTEGER,
    max_length_place_recipient INTEGER,
    max_width_place_recipient INTEGER,
    max_height_place_recipient INTEGER,
    prohibited_sending BOOLEAN DEFAULT false,
    prohibited_issuance BOOLEAN DEFAULT false,
    max_cost_place DECIMAL(12, 2),
    max_declared_cost_place DECIMAL(12, 2),
    work_schedule JSONB,
    full_address JSONB,
    settings JSONB,
    additional_ids JSONB,
    photos JSONB,
    attributes JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    nova_created_at TIMESTAMP,
    nova_updated_at TIMESTAMP,
    nova_deleted_at TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_divisions_nova_id ON divisions(nova_id);
CREATE INDEX idx_divisions_country_code ON divisions(country_code);
CREATE INDEX idx_divisions_city_id ON divisions(city_id);
CREATE INDEX idx_divisions_status ON divisions(status);
CREATE INDEX idx_divisions_division_category ON divisions(division_category);
CREATE INDEX idx_divisions_location ON divisions USING GIST(location);
CREATE INDEX idx_divisions_coordinates ON divisions(latitude, longitude);

CREATE INDEX idx_cities_nova_id ON cities(nova_id);
CREATE INDEX idx_cities_country_code ON cities(country_code);

-- Insert default countries
INSERT INTO countries (code, name) VALUES 
    ('UA', 'Ukraine'),
    ('PL', 'Poland')
ON CONFLICT (code) DO NOTHING; 