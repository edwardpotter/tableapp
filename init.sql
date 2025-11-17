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

-- Scripts table for saved presentation sequences
CREATE TABLE IF NOT EXISTS scripts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Script steps table for individual actions within a script
CREATE TABLE IF NOT EXISTS script_steps (
    id SERIAL PRIMARY KEY,
    script_id INTEGER NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    step_type VARCHAR(50) NOT NULL, -- 'property' or 'web_content'
    property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
    canvas_pid VARCHAR(255),
    web_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_step_type CHECK (step_type IN ('property', 'web_content'))
);

-- Create indexes for scripts
CREATE INDEX IF NOT EXISTS idx_script_steps_script_id ON script_steps(script_id);
CREATE INDEX IF NOT EXISTS idx_script_steps_order ON script_steps(script_id, step_order);
