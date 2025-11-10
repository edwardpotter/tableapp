const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection - delete ors pre-production
const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'myapp',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Get configuration values
app.get('/api/config', (req, res) => {
  res.json({
    countdownSeconds: parseInt(process.env.COUNTDOWN_SECONDS || '120', 10)
  });
});

// Admin authentication endpoint
app.post('/api/admin/authenticate', (req, res) => {
  const { code } = req.body;
  const ADMIN_CODE = process.env.ADMIN_CODE || '0710'; // In production, use environment variable
  
  if (code === ADMIN_CODE) {
    res.json({ success: true, message: 'Authentication successful' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid code' });
  }
});

// Admin data refresh endpoint
app.post('/api/admin/refresh', async (req, res) => {
  try {
    console.log('Starting data refresh...');
    
    // Fetch data from external API (updated URL with latitude and longitude)
    const apiUrl = 'https://gcp-us-east1.api.carto.com/v3/sql/us_svc_canvas_carto/query?q=select%0A%20%20%20%20distinct%0A%20%20%20%20%20%20%20%20canvas_pid%2C%0A%20%20%20%20%20%20%20%20primary_address%2C%0A%20%20%20%20%20%20%20%20canvas_submarket%2C%0A%20%20%20%20%20%20%20%20property_class%2C%0A%20%20%20%20%20%20%20%20latitude%2C%0A%20%20%20%20%20%20%20%20longitude%0Afrom%0A%20%20%20%20PROD_CANVAS_DB.DATA.CANVAS_PROPERTIES%0Awhere%0A%20%20%20%20canvas_pid%20in%20(%0A%20%20%20%20%20%20%20%20select%20%0A%20%20%20%20%20%20%20%20%20%20%20%20min(canvas_pid)%0A%20%20%20%20%20%20%20%20from%0A%20%20%20%20%20%20%20%20%20%20%20%20PROD_CANVAS_DB.DATA.CANVAS_PROPERTIES%0A%20%20%20%20%20%20%20%20where%0A%20%20%20%20%20%20%20%20%20%20%20%20canvas_region_id%20%3D%208491580179800618632%0A%20%20%20%20%20%20%20%20%20%20%20%20and%20property_type%20%3D%20%27Office%27%0A%20%20%20%20%20%20%20%20group%20by%20primary_address%0A%20%20%20%20)%0A%20%20%20%20and%20property_class%20is%20not%20null%0Aorder%20by%20primary_address%20asc';
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhIjoiYWNfeG03N2kwbmoiLCJqdGkiOiJjNWZhNDg5NiJ9.haDyxrwvNByCclGuXe58BAuEF8DDsnHNj-7dNwQG3xI',
        'Cache-Control': 'max-age=300'
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Received ${data.rows?.length || 0} properties from API`);

    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Clear existing properties
      await client.query('DELETE FROM properties');
      console.log('Cleared existing properties');

      // Insert new properties
      if (data.rows && data.rows.length > 0) {
        let successCount = 0;
        
        for (const row of data.rows) {
          // CARTO returns UPPERCASE field names
          // Convert large number to string to preserve precision
          const canvasPid = row.CANVAS_PID ? String(row.CANVAS_PID) : null;
          const primaryAddress = row.PRIMARY_ADDRESS || null;
          const canvasSubmarket = row.CANVAS_SUBMARKET || null;
          const propertyClass = row.PROPERTY_CLASS || null;
          const latitude = row.LATITUDE || null;
          const longitude = row.LONGITUDE || null;
          
          // Skip rows with null canvas_pid
          if (!canvasPid) {
            console.warn('Skipping row with null CANVAS_PID:', JSON.stringify(row));
            continue;
          }
          
          try {
            await client.query(
              'INSERT INTO properties (canvas_pid, primary_address, canvas_submarket, property_class, latitude, longitude) VALUES ($1, $2, $3, $4, $5, $6)',
              [canvasPid, primaryAddress, canvasSubmarket, propertyClass, latitude, longitude]
            );
            successCount++;
          } catch (insertErr) {
            console.error('Error inserting row:', insertErr.message, 'Row:', JSON.stringify(row));
          }
        }
        
        console.log(`Inserted ${successCount} properties (skipped ${data.rows.length - successCount} invalid rows)`);
      }

      await client.query('COMMIT');
      
      // Log the refresh event
      await pool.query(
        `INSERT INTO usage_logs (event_type, metadata)
        VALUES ('admin_refresh', $1)`,
        [JSON.stringify({ recordsProcessed: data.rows.length })]
      );

      res.json({ 
        success: true, 
        message: 'Data refreshed successfully',
        recordsProcessed: data.rows?.length || 0
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error refreshing data:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to refresh data',
      error: err.message 
    });
  }
});

// Get all properties with optional filters
app.get('/api/properties', async (req, res) => {
  try {
    const { search, submarket, property_class } = req.query;
    
    let query = 'SELECT * FROM properties WHERE 1=1';
    const params = [];
    let paramCount = 0;

    // Add search filter for primary_address
    if (search) {
      paramCount++;
      query += ` AND primary_address ILIKE ${paramCount}`;
      params.push(`%${search}%`);
    }

    // Add submarket filter
    if (submarket) {
      paramCount++;
      query += ` AND canvas_submarket = ${paramCount}`;
      params.push(submarket);
    }

    // Add property_class filter
    if (property_class) {
      paramCount++;
      query += ` AND property_class = ${paramCount}`;
      params.push(property_class);
    }

    query += ' ORDER BY primary_address';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching properties:', err);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

// Get unique submarkets for filter dropdown
app.get('/api/properties/submarkets', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT canvas_submarket FROM properties WHERE canvas_submarket IS NOT NULL ORDER BY canvas_submarket'
    );
    res.json(result.rows.map(row => row.canvas_submarket));
  } catch (err) {
    console.error('Error fetching submarkets:', err);
    res.status(500).json({ error: 'Failed to fetch submarkets' });
  }
});

// Get unique property classes for filter dropdown
app.get('/api/properties/classes', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT property_class FROM properties WHERE property_class IS NOT NULL ORDER BY property_class'
    );
    res.json(result.rows.map(row => row.property_class));
  } catch (err) {
    console.error('Error fetching property classes:', err);
    res.status(500).json({ error: 'Failed to fetch property classes' });
  }
});


// Usage Tracking
app.post('/api/usage/log', async (req, res) => {
  try {
    const {
      event_type,
      canvas_pid,
      primary_address,
      canvas_submarket,
      property_class,
      metadata
    } = req.body;

    // Validate required fields
    if (!event_type) {
      return res.status(400).json({ error: 'event_type is required' });
    }

    // Only allow specific event types
    if (!['table_activate', 'admin_refresh'].includes(event_type)) {
      return res.status(400).json({ error: 'Invalid event_type. Must be table_activate or admin_refresh' });
    }

    // Get property_id if canvas_pid is provided
    let property_id = null;
    if (canvas_pid) {
      const propertyResult = await pool.query(
        'SELECT id FROM properties WHERE canvas_pid = $1',
        [canvas_pid]
      );
      if (propertyResult.rows.length > 0) {
        property_id = propertyResult.rows[0].id;
      }
    }

    // Insert usage log
    const result = await pool.query(
      `INSERT INTO usage_logs 
       (event_type, property_id, canvas_pid, primary_address, canvas_submarket, property_class, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        event_type,
        property_id,
        canvas_pid,
        primary_address,
        canvas_submarket,
        property_class,
        metadata ? JSON.stringify(metadata) : null
      ]
    );

    res.json({ success: true, log: result.rows[0] });
  } catch (err) {
    console.error('Error logging usage:', err);
    res.status(500).json({ error: 'Failed to log usage event' });
  }
});

app.get('/api/usage/analytics', async (req, res) => {
  try {
    const { start_date, end_date, limit } = req.query;

    // Build date filter
    let dateFilter = '';
    const params = [];
    let paramCount = 1;

    if (start_date) {
      dateFilter += ` AND created_at >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      dateFilter += ` AND created_at <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    // Get total events by type
    const eventsByType = await pool.query(
      `SELECT event_type, COUNT(*) as count
       FROM usage_logs
       WHERE 1=1 ${dateFilter}
       GROUP BY event_type
       ORDER BY count DESC`,
      params
    );

    // Get most activated properties
    const topProperties = await pool.query(
      `SELECT 
         canvas_pid,
         primary_address,
         canvas_submarket,
         property_class,
         COUNT(*) as activation_count
       FROM usage_logs
       WHERE event_type = 'table_activate' 
         AND canvas_pid IS NOT NULL
         ${dateFilter}
       GROUP BY canvas_pid, primary_address, canvas_submarket, property_class
       ORDER BY activation_count DESC
       LIMIT ${limit || 10}`,
      params
    );

    // Get activity by day
    const activityByDay = await pool.query(
      `SELECT 
         DATE(created_at) as date,
         COUNT(*) as total_events,
         COUNT(*) FILTER (WHERE event_type = 'table_activate') as activations,
         COUNT(*) FILTER (WHERE event_type = 'admin_refresh') as refreshes
       FROM usage_logs
       WHERE 1=1 ${dateFilter}
       GROUP BY DATE(created_at)
       ORDER BY date DESC
       LIMIT ${limit || 30}`,
      params
    );

    // Get activity by hour of day
    const activityByHour = await pool.query(
      `SELECT 
         EXTRACT(HOUR FROM created_at) as hour,
         COUNT(*) as event_count
       FROM usage_logs
       WHERE 1=1 ${dateFilter}
       GROUP BY EXTRACT(HOUR FROM created_at)
       ORDER BY hour`,
      params
    );

    // Get total statistics
    const totalStats = await pool.query(
      `SELECT 
         COUNT(*) as total_events,
         COUNT(DISTINCT canvas_pid) FILTER (WHERE canvas_pid IS NOT NULL) as unique_properties_activated,
         COUNT(*) FILTER (WHERE event_type = 'table_activate') as total_activations,
         COUNT(*) FILTER (WHERE event_type = 'admin_refresh') as total_refreshes,
         MIN(created_at) as first_event,
         MAX(created_at) as last_event
       FROM usage_logs
       WHERE 1=1 ${dateFilter}`,
      params
    );

    res.json({
      summary: totalStats.rows[0],
      eventsByType: eventsByType.rows,
      topProperties: topProperties.rows,
      activityByDay: activityByDay.rows,
      activityByHour: activityByHour.rows
    });
  } catch (err) {
    console.error('Error fetching analytics:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

app.get('/api/usage/recent', async (req, res) => {
  try {
    const limit = req.query.limit || 50;
    
    const result = await pool.query(
      `SELECT * FROM usage_logs
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching recent usage:', err);
    res.status(500).json({ error: 'Failed to fetch recent usage' });
  }
});


// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});