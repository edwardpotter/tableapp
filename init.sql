-- Create properties table for external data
CREATE TABLE IF NOT EXISTS properties (
    id SERIAL PRIMARY KEY,
    canvas_pid VARCHAR(255) UNIQUE NOT NULL,
    primary_address TEXT,
    canvas_submarket VARCHAR(255),
    property_class VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on canvas_pid for faster lookups
CREATE INDEX IF NOT EXISTS idx_properties_canvas_pid ON properties(canvas_pid);

-- Create index on latitude/longitude for geospatial queries
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(latitude, longitude);

--Example stuff can be killed pre-production
-- Create example table
CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create example related table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key relationship
ALTER TABLE items ADD COLUMN category_id INTEGER REFERENCES categories(id);

-- Insert sample data
INSERT INTO categories (name) VALUES ('Category 1'), ('Category 2');
INSERT INTO items (name, description, category_id) VALUES 
    ('Item 1', 'Description 1', 1),
    ('Item 2', 'Description 2', 2);