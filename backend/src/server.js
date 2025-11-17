const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const carto_token = process.env.CARTO_API_TOKEN;

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
    countdownSeconds: parseInt(process.env.COUNTDOWN_SECONDS || '120', 10),
    showHtmlPanel: process.env.SHOW_HTML_PANEL === 'TRUE',
    showMarketCanvas2: process.env.SHOW_MARKET_CANVAS_2 === 'TRUE',
    scriptsEnabled: process.env.SCRIPTS_ENABLED === 'TRUE',
    theme: process.env.DEFAULT_THEME || 'light'
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

// Get admin code length (for dynamic keypad)
app.get('/api/admin/code-length', (req, res) => {
  const ADMIN_CODE = process.env.ADMIN_CODE || '0710';
  res.json({ length: ADMIN_CODE.length });
});

// Update configuration endpoint
app.post('/api/admin/config', (req, res) => {
  const { showHtmlPanel, showMarketCanvas2, scriptsEnabled, theme } = req.body;
  
  try {
    let updated = false;
    const updates = {};
    
    // Validate and prepare updates
    if (typeof showHtmlPanel === 'boolean') {
      process.env.SHOW_HTML_PANEL = showHtmlPanel ? 'TRUE' : 'FALSE';
      updates.SHOW_HTML_PANEL = showHtmlPanel ? 'TRUE' : 'FALSE';
      updated = true;
    }
    
    if (typeof showMarketCanvas2 === 'boolean') {
      process.env.SHOW_MARKET_CANVAS_2 = showMarketCanvas2 ? 'TRUE' : 'FALSE';
      updates.SHOW_MARKET_CANVAS_2 = showMarketCanvas2 ? 'TRUE' : 'FALSE';
      updated = true;
    }
    
    if (typeof scriptsEnabled === 'boolean') {
      process.env.SCRIPTS_ENABLED = scriptsEnabled ? 'TRUE' : 'FALSE';
      updates.SCRIPTS_ENABLED = scriptsEnabled ? 'TRUE' : 'FALSE';
      updated = true;
    }
    
    if (theme && (theme === 'light' || theme === 'dark')) {
      process.env.DEFAULT_THEME = theme;
      updates.DEFAULT_THEME = theme;
      updated = true;
    }
    
    if (!updated) {
      return res.status(400).json({ error: 'No valid configuration updates provided' });
    }
    
    // Update .env file
    const envPath = path.join(__dirname, '../.env');
    let envContent = '';
    
    // Read existing .env file if it exists
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Update or add configuration values
    const envLines = envContent.split('\n');
    const updatedEnvLines = envLines.map(line => {
      for (const [key, value] of Object.entries(updates)) {
        if (line.startsWith(`${key}=`)) {
          return `${key}=${value}`;
        }
      }
      return line;
    });
    
    // Add any missing keys
    for (const [key, value] of Object.entries(updates)) {
      if (!updatedEnvLines.some(line => line.startsWith(`${key}=`))) {
        updatedEnvLines.push(`${key}=${value}`);
      }
    }
    
    // Write back to .env file
    fs.writeFileSync(envPath, updatedEnvLines.join('\n'), 'utf8');
    
    console.log('Configuration updated:', updates);
    
    res.json({ 
      success: true, 
      message: 'Configuration updated and saved to .env file',
      showHtmlPanel: process.env.SHOW_HTML_PANEL === 'TRUE',
      showMarketCanvas2: process.env.SHOW_MARKET_CANVAS_2 === 'TRUE',
      scriptsEnabled: process.env.SCRIPTS_ENABLED === 'TRUE',
      theme: process.env.DEFAULT_THEME || 'light'
    });
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update configuration',
      error: error.message 
    });
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
        'Authorization': `Bearer ${carto_token}`,
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




// Script Management Endpoints

// Get all scripts
app.get('/api/scripts', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, 
        COUNT(ss.id) as step_count
       FROM scripts s
       LEFT JOIN script_steps ss ON s.id = ss.script_id
       GROUP BY s.id
       ORDER BY s.updated_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching scripts:', err);
    res.status(500).json({ error: 'Failed to fetch scripts' });
  }
});

// Get script by ID with steps
app.get('/api/scripts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get script details
    const scriptResult = await pool.query(
      'SELECT * FROM scripts WHERE id = $1',
      [id]
    );
    
    if (scriptResult.rows.length === 0) {
      return res.status(404).json({ error: 'Script not found' });
    }
    
    // Get script steps with property details
    const stepsResult = await pool.query(
      `SELECT ss.*, 
        p.primary_address, p.canvas_submarket, p.property_class,
        p.latitude, p.longitude
       FROM script_steps ss
       LEFT JOIN properties p ON ss.property_id = p.id
       WHERE ss.script_id = $1
       ORDER BY ss.step_order ASC`,
      [id]
    );
    
    res.json({
      ...scriptResult.rows[0],
      steps: stepsResult.rows
    });
  } catch (err) {
    console.error('Error fetching script:', err);
    res.status(500).json({ error: 'Failed to fetch script' });
  }
});

// Create new script
app.post('/api/scripts', async (req, res) => {
  try {
    const { name, description, steps } = req.body;
    
    if (!name || !steps || steps.length === 0) {
      return res.status(400).json({ error: 'Name and at least one step are required' });
    }
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Insert script
      const scriptResult = await client.query(
        'INSERT INTO scripts (name, description) VALUES ($1, $2) RETURNING *',
        [name, description || null]
      );
      
      const scriptId = scriptResult.rows[0].id;
      
      // Insert steps
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        
        // Get property_id if canvas_pid provided
        let propertyId = null;
        if (step.step_type === 'property' && step.canvas_pid) {
          const propResult = await client.query(
            'SELECT id FROM properties WHERE canvas_pid = $1',
            [step.canvas_pid]
          );
          if (propResult.rows.length > 0) {
            propertyId = propResult.rows[0].id;
          }
        }
        
        await client.query(
          `INSERT INTO script_steps 
           (script_id, step_order, step_type, property_id, canvas_pid, web_url)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            scriptId,
            i,
            step.step_type,
            propertyId,
            step.canvas_pid || null,
            step.web_url || null
          ]
        );
      }
      
      await client.query('COMMIT');
      
      // Return created script with steps
      const finalScript = await pool.query(
        `SELECT s.*, 
          json_agg(
            json_build_object(
              'id', ss.id,
              'step_order', ss.step_order,
              'step_type', ss.step_type,
              'canvas_pid', ss.canvas_pid,
              'web_url', ss.web_url,
              'primary_address', p.primary_address,
              'canvas_submarket', p.canvas_submarket,
              'property_class', p.property_class
            ) ORDER BY ss.step_order
          ) as steps
         FROM scripts s
         LEFT JOIN script_steps ss ON s.id = ss.script_id
         LEFT JOIN properties p ON ss.property_id = p.id
         WHERE s.id = $1
         GROUP BY s.id`,
        [scriptId]
      );
      
      res.json(finalScript.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error creating script:', err);
    res.status(500).json({ error: 'Failed to create script' });
  }
});

// Update script
app.put('/api/scripts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, steps } = req.body;
    
    if (!name || !steps || steps.length === 0) {
      return res.status(400).json({ error: 'Name and at least one step are required' });
    }
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Update script
      await client.query(
        'UPDATE scripts SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        [name, description || null, id]
      );
      
      // Delete existing steps
      await client.query('DELETE FROM script_steps WHERE script_id = $1', [id]);
      
      // Insert new steps
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        
        // Get property_id if canvas_pid provided
        let propertyId = null;
        if (step.step_type === 'property' && step.canvas_pid) {
          const propResult = await client.query(
            'SELECT id FROM properties WHERE canvas_pid = $1',
            [step.canvas_pid]
          );
          if (propResult.rows.length > 0) {
            propertyId = propResult.rows[0].id;
          }
        }
        
        await client.query(
          `INSERT INTO script_steps 
           (script_id, step_order, step_type, property_id, canvas_pid, web_url)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            id,
            i,
            step.step_type,
            propertyId,
            step.canvas_pid || null,
            step.web_url || null
          ]
        );
      }
      
      await client.query('COMMIT');
      
      // Return updated script with steps
      const finalScript = await pool.query(
        `SELECT s.*, 
          json_agg(
            json_build_object(
              'id', ss.id,
              'step_order', ss.step_order,
              'step_type', ss.step_type,
              'canvas_pid', ss.canvas_pid,
              'web_url', ss.web_url,
              'primary_address', p.primary_address,
              'canvas_submarket', p.canvas_submarket,
              'property_class', p.property_class
            ) ORDER BY ss.step_order
          ) as steps
         FROM scripts s
         LEFT JOIN script_steps ss ON s.id = ss.script_id
         LEFT JOIN properties p ON ss.property_id = p.id
         WHERE s.id = $1
         GROUP BY s.id`,
        [id]
      );
      
      res.json(finalScript.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error updating script:', err);
    res.status(500).json({ error: 'Failed to update script' });
  }
});

// Delete script
app.delete('/api/scripts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM scripts WHERE id = $1', [id]);
    res.json({ success: true, message: 'Script deleted' });
  } catch (err) {
    console.error('Error deleting script:', err);
    res.status(500).json({ error: 'Failed to delete script' });
  }
});

// Market Canvas 2.0 Presentation Control
app.post('/api/marketcanvas2/present', async (req, res) => {
  try {
    const { propertyId } = req.body;
    
    if (!propertyId) {
      return res.status(400).json({ error: 'propertyId is required' });
    }
    
    console.log('Triggering Market Canvas 2.0 presentation for property:', propertyId);
    
    // Prepare the POST request to Market Canvas 2.0
    const response = await fetch('https://marketcanvas.cbre.com/api/presentation-control', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': '_ga=GA1.1.1832809187.1706554134; ab.storage.deviceId.240e177d-4779-41c2-b484-3af37ffa8685=%7B%22g%22%3A%22c8da736e-3d91-b64c-c396-686d96a624d1%22%2C%22c%22%3A1730133185652%2C%22l%22%3A1730133185652%7D; visid_incap_3190064=vOzceI7YTJmnsKLlvXrXJu71rWcAAAAAQUIPAAAAAABqII9p5+8/EUhdRDsgP+CP; _ga_86T47RWEX6=GS2.1.s1747749207$o10$g1$t1747749666$j0$l0$h0; PS_DEVICEFEATURES=maf:0 width:2560 height:1440 clientWidth:2560 clientHeight:1246 pixelratio:2 touch:0 geolocation:1 websockets:1 webworkers:1 datepicker:1 dtpicker:1 timepicker:1 dnd:1 sessionstorage:1 localstorage:1 history:1 canvas:1 svg:1 postmessage:1 hc:0; visid_incap_2851110=mQIWYO6yQXONGjQFzvih/7bkF2cAAAAASkIPAAAAAACoTRS5yTJooztolcKhm2dI; _ga_VH4HPCKV6C=GS2.1.s1751478647$o209$g1$t1751478991$j60$l0$h0; AMP_MKTG_f1f0c437e3=JTdCJTdE; _cs_c=0; AMP_MKTG_8eb4210a2e=JTdCJTdE; ab.storage.sessionId.240e177d-4779-41c2-b484-3af37ffa8685=%7B%22g%22%3A%22bd47c34a-68cd-1441-bbf6-98dc3820a5d6%22%2C%22e%22%3A1753984315886%2C%22c%22%3A1753982515887%2C%22l%22%3A1753982515887%7D; mf_user=35c69a0615f5eb61ed8578fd9f074965|; coveo_visitorId=0d031e63-5c25-4351-b36e-14483c16efc0; ajs_anonymous_id=1f27cd1b-090e-4aef-9d90-f3deaa817140; _gcl_au=1.1.1097265994.1756995818; _ga_7LRS43KFTK=GS2.1.s1759871654$o5$g0$t1759871654$j60$l0$h0; _cs_id=f074d596-ca00-a434-8284-25fc8013a944.1752864638.176.1762203993.1762203993.1.1786028638675.0.x; __Host-next-auth.csrf-token=a14f8fc5e6062f3a841b3c93213a14f284dee41abd40beec1687620bf8fe68d4%7Cbb1040e9ef7742b6ff2bcda3850945875bd349370c40e702a7c891b84934e80a; __Secure-next-auth.callback-url=https%3A%2F%2Fmarketcanvas.cbre.com%2Fmarkets%2F3779438571417133057%2Fresearch-stats%2Fproperty-results%3FsubmarketIds%3D%255B%2522102781835689495318%2522%255D; _cfuvid=MoXYAjW8v8mx_afu.tcexXpvIheA3wrnNsjkotYMTBo-1762973250233-0.0.1.1-604800000; AMP_f1f0c437e3=JTdCJTIyZGV2aWNlSWQlMjIlM0ElMjI3ZTQ2N2JlZi1iZDdjLTRjNjMtYjU5Zi1lY2I5ZTM5NmE0ODclMjIlMkMlMjJ1c2VySWQlMjIlM0ElMjJlZC5wb3R0ZXIlNDBjYnJlLmNvbSUyMiUyQyUyMnNlc3Npb25JZCUyMiUzQTE3NjMwNDk4NjY5ODclMkMlMjJvcHRPdXQlMjIlM0FmYWxzZSUyQyUyMmxhc3RFdmVudFRpbWUlMjIlM0ExNzYzMDUwMzQwMTEyJTJDJTIybGFzdEV2ZW50SWQlMjIlM0EzMjclMkMlMjJwYWdlQ291bnRlciUyMiUzQTklN0Q=; mp_bbd66bca010bd4bb2cb3bed77fa6db02_mixpanel=%7B%22distinct_id%22%3A%20%221b51c7d3-a188-47cb-b45b-615cd1d5aa64%22%2C%22%24device_id%22%3A%20%2219055b5dd6e237-0dee7b746db146-19525637-4da900-19055b5dd6e237%22%2C%22%24initial_referrer%22%3A%20%22https%3A%2F%2Fmarketcanvas.cbre.com%2F%22%2C%22%24initial_referring_domain%22%3A%20%22marketcanvas.cbre.com%22%2C%22__mps%22%3A%20%7B%7D%2C%22__mpso%22%3A%20%7B%7D%2C%22__mpus%22%3A%20%7B%7D%2C%22__mpa%22%3A%20%7B%7D%2C%22__mpu%22%3A%20%7B%7D%2C%22__mpr%22%3A%20%5B%5D%2C%22__mpap%22%3A%20%5B%5D%2C%22%24user_id%22%3A%20%221b51c7d3-a188-47cb-b45b-615cd1d5aa64%22%2C%22clusterId%22%3A%20%22a83ea3cb-32de-11ee-b71b-5bb1e%22%2C%22clusterName%22%3A%20%22cbre-dev%22%2C%22releaseVersion%22%3A%20%229.12.5.cl-220%22%2C%22hostAppUrl%22%3A%20%22marketcanvas.cbre.com%22%7D; __Secure-next-auth.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..jezFp73JKxJO55FB.PMXNdGeq81KD3G59CsFrc0ns2ObMncrnnBcXKrwObaCtztZyIayrgjXyAPT25J849CT2fksX2BxzTS3vt-pNMEPFlrQy1zA7Cv5FNOtkuxRRBmlCp2tbcHp7Wdkk_9mxZVH02Hk7_Rzv9wRpxr5wznSrWGVjz_SaztGSbhzrIJkGzqapF_fCeYbPS845gYDGSZrpZ7xak5VMZuCffg.CIvS7jm-QD8Uhn-1dcne0g; experience-center=dc-through-nat; AMP_8eb4210a2e=JTdCJTIyZGV2aWNlSWQlMjIlM0ElMjJmN2NhZWY5Zi00NjQ0LTQ3MTYtYjc5ZS1kNDRhOTBjZjRhZDclMjIlMkMlMjJ1c2VySWQlMjIlM0ElMjJlZC5wb3R0ZXIlNDBjYnJlLmNvbSUyMiUyQyUyMnNlc3Npb25JZCUyMiUzQTE3NjMwNjAzNzA2ODglMkMlMjJvcHRPdXQlMjIlM0FmYWxzZSUyQyUyMmxhc3RFdmVudFRpbWUlMjIlM0ExNzYzMDYxNDgyMzQ1JTJDJTIybGFzdEV2ZW50SWQlMjIlM0EyMTM2JTJDJTIycGFnZUNvdW50ZXIlMjIlM0E4JTdE'
      },
      body: JSON.stringify({
        action: 'start_browser',
        url: `https://marketcanvas.cbre.com/public/properties/${propertyId}/overview`
      })
    });
    
    if (!response.ok) {
      throw new Error(`Market Canvas 2.0 API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Market Canvas 2.0 presentation response:', data);
    
    res.json({
      success: true,
      message: 'Market Canvas 2.0 presentation started',
      data: data
    });
  } catch (error) {
    console.error('Error triggering Market Canvas 2.0 presentation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger Market Canvas 2.0 presentation',
      error: error.message
    });
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