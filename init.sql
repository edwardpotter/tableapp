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