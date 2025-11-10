-- Drop old example tables if they exist
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

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

-- Usage tracking table
CREATE TABLE IF NOT EXISTS usage_logs (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
    canvas_pid VARCHAR(255),
    primary_address TEXT,
    canvas_submarket VARCHAR(255),
    property_class VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for usage_logs
CREATE INDEX IF NOT EXISTS idx_usage_logs_event_type ON usage_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_canvas_pid ON usage_logs(canvas_pid);
CREATE INDEX IF NOT EXISTS idx_usage_logs_property_id ON usage_logs(property_id);
