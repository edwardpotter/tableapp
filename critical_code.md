# Critical Code Reference

## ⚠️ DO NOT MODIFY WITHOUT TESTING

This document contains code patterns that are critical to the application's functionality. These patterns have been tested and validated with external systems (Unreal Engine, CARTO API). Changes to these patterns will break functionality.

---

## Table Activation API Call

**Location:** `frontend/src/components/HomePage.jsx` - `handleActivateTable()`

**Endpoint:** `https://experience-center-room-dc-srv1.cbre.com/remote/object/call`

**Critical Pattern:**

```javascript
const handleActivateTable = async () => {
  if (!selectedProperty) return;

  const canvasPid = selectedProperty.canvas_pid;
  const latitude = selectedProperty.latitude || 38.905172;
  const longitude = selectedProperty.longitude || -77.0046697;
  
  const requestBody = {
    objectPath: "/Game/CBRE_MC/PinTable/PinTable_Cesium_Mockup.PinTable_Cesium_Mockup:PersistentLevel.BP_CameraRig_C_UAID_047C16D0FB2829DF01_1089232868",
    functionName: "RemoteWebCommand",
    parameters: {
      JSONParams: JSON.stringify({
        uecmd: "ShowUnrealPreset",
        parameters: {
          routeURL: `https://marketcanvas.cbre.com/v1/properties/${canvasPid}/overview/map`,
          presetName: "properties_overview_map",
          queries: {
            boundsSQL: "",
            propertiesSQL: `SELECT PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.canvas_pid, PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.canvas_primary_address, PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.geom, PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.floor, PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.floor_height, PROD_CANVAS_DB.DATA.CANVAS_PROPERTIES.stories, PROD_CANVAS_DB.DATA.CANVAS_PROPERTIES.latitude, PROD_CANVAS_DB.DATA.CANVAS_PROPERTIES.longitude, PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.ed_max_height, PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.total_avail_floorspace, PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.block_contiguous_size, PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.floors, PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.spacetypename, PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.occupancy, PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.rentlow_s, PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.renthigh_s, PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.rent_type, PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.leasing_company, PROD_CANVAS_DB.DATA.CANVAS_PROPERTIES.property_type FROM PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK LEFT JOIN PROD_CANVAS_DB.DATA.CANVAS_PROPERTIES ON (PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.canvas_pid = PROD_CANVAS_DB.DATA.CANVAS_PROPERTIES.canvas_pid) WHERE (1 = 1) AND (PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.canvas_pid = '${canvasPid}') ORDER BY PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.floor DESC`,
            pointsSQL: "",
            focusPropertySQL: "",
            floorsSQL: ""
          },
          pageContent: {
            left: `https://marketcanvas.cbre.com/embeddable-widget/properties/${canvasPid}/overview/map?tvmode=on`,
            right: `https://marketcanvas.cbre.com/embeddable-widget/properties/${canvasPid}/overview/photos?tvmode=on`
          },
          view: "3d",
          NPRMode: false,
          viewState: {
            latitude: latitude,
            longitude: longitude,
            zoom: 15,
            pitch: 0,
            bearing: 0,
            minZoom: 0,
            maxZoom: 15
          }
        }
      })
    }
  };

  const response = await axios.put(
    'https://experience-center-room-dc-srv1.cbre.com/remote/object/call',
    requestBody,
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
};
```

### ⚠️ Critical Requirements

1. **objectPath** - Must be EXACT string:
   ```
   /Game/CBRE_MC/PinTable/PinTable_Cesium_Mockup.PinTable_Cesium_Mockup:PersistentLevel.BP_CameraRig_C_UAID_047C16D0FB2829DF01_1089232868
   ```

2. **functionName** - Must be: `"RemoteWebCommand"`

3. **JSONParams** - Must use `JSON.stringify()` on the entire parameters object

4. **uecmd** - Must be `"ShowUnrealPreset"` (NOT `"command"` or `"cmd"`)

5. **parameters** - Must be nested under `uecmd`, NOT `"params"`

6. **SQL Query** - Must include ALL fields from CANVAS_AVAILABLE_STACK and CANVAS_PROPERTIES

7. **Widget URLs** - Must use `marketcanvas.cbre.com/embeddable-widget` format with `?tvmode=on`

### Common Mistakes to Avoid

❌ **WRONG:**
```javascript
parameters: {
  JSONParams: `{"command":"ShowUnrealPreset","params":{...}}`  // Wrong keys
}
```

❌ **WRONG:**
```javascript
parameters: {
  JSONParams: {  // Not stringified
    uecmd: "ShowUnrealPreset",
    parameters: {...}
  }
}
```

✅ **CORRECT:**
```javascript
parameters: {
  JSONParams: JSON.stringify({
    uecmd: "ShowUnrealPreset",
    parameters: {...}
  })
}
```

---

## Table Flatten API Call

**Location:** `frontend/src/components/HomePage.jsx` - `handleFlattenTable()`

**Critical Pattern:**

```javascript
const handleFlattenTable = async () => {
  const requestBody = {
    objectPath: "/Game/CBRE_MC/PinTable/PinTable_Cesium_Mockup.PinTable_Cesium_Mockup:PersistentLevel.BP_CameraRig_C_UAID_047C16D0FB2829DF01_1089232868",
    functionName: "RemoteWebCommand",
    parameters: {
      JSONParams: JSON.stringify({
        uecmd: "ShowUnrealPreset",
        parameters: {
          presetName: "intro",
          view: "2d"
        }
      })
    }
  };

  const response = await axios.put(
    'https://experience-center-room-dc-srv1.cbre.com/remote/object/call',
    requestBody,
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
};
```

### ⚠️ Critical Requirements

1. **Same objectPath** as activation
2. **Same functionName** as activation
3. **Simplified parameters** - Only needs `presetName` and `view`
4. **Still uses JSON.stringify()** for JSONParams

---

## CARTO API Data Refresh

**Location:** `backend/src/server.js` - `POST /api/admin/refresh`

**Endpoint:** `https://gcp-us-east1.api.carto.com/v3/sql/us_svc_canvas_carto/query`

**Critical Pattern:**

```javascript
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
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Clear existing properties
    await client.query('DELETE FROM properties');
    
    // Insert new properties
    for (const row of data.rows) {
      await client.query(
        `INSERT INTO properties (canvas_pid, primary_address, canvas_submarket, property_class, latitude, longitude)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          String(row.CANVAS_PID),  // Convert to string!
          row.PRIMARY_ADDRESS || '',
          row.CANVAS_SUBMARKET || '',
          row.PROPERTY_CLASS || '',
          row.LATITUDE || null,
          row.LONGITUDE || null,
        ]
      );
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    // Log the refresh event
    await pool.query(
      `INSERT INTO usage_logs (event_type, metadata)
       VALUES ('admin_refresh', $1)`,
      [JSON.stringify({ recordsProcessed: data.rows.length })]
    );
    
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});
```

### ⚠️ Critical Requirements

1. **Bearer Token** - Must be included in Authorization header
2. **SQL Query** - Must select DISTINCT ON (PRIMARY_ADDRESS)
3. **Region ID** - Must filter by `canvas_region_id = 8491580179800618632` (DC region)
4. **Property Type** - Must filter by `PROPERTY_TYPE = 'Office'`
5. **CANVAS_PID Conversion** - Must use `String(row.CANVAS_PID)` to prevent precision loss
6. **Field Name Mapping** - CARTO returns UPPERCASE, must map to lowercase in DB
7. **Transaction Safety** - Must use BEGIN/COMMIT/ROLLBACK pattern
8. **Usage Logging** - Must log after successful commit

### Common Mistakes to Avoid

❌ **WRONG:**
```javascript
canvas_pid: row.CANVAS_PID  // Will lose precision for large numbers
```

✅ **CORRECT:**
```javascript
canvas_pid: String(row.CANVAS_PID)  // Preserves full precision
```

❌ **WRONG:**
```javascript
// Not using transaction
await pool.query('DELETE FROM properties');
await pool.query('INSERT INTO properties...');  // Could fail partially
```

✅ **CORRECT:**
```javascript
await client.query('BEGIN');
try {
  await client.query('DELETE FROM properties');
  // ... inserts
  await client.query('COMMIT');
} catch (err) {
  await client.query('ROLLBACK');
}
```

---

## Database Schema - Canvas PID Storage

**Location:** `init.sql`

**Critical Pattern:**

```sql
CREATE TABLE properties (
    id SERIAL PRIMARY KEY,
    canvas_pid VARCHAR(255) UNIQUE NOT NULL,  -- MUST be VARCHAR, not BIGINT
    primary_address TEXT,
    canvas_submarket VARCHAR(255),
    property_class VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### ⚠️ Critical Requirements

1. **canvas_pid Type** - MUST be `VARCHAR(255)`, NOT `BIGINT` or `INTEGER`
   - Reason: Canvas PIDs are 19-digit numbers that exceed JavaScript's safe integer limit (2^53 - 1)
   - JavaScript cannot safely handle these large numbers
   - Storing as string prevents precision loss

2. **UNIQUE Constraint** - Must be on canvas_pid to prevent duplicates

---

## Usage Tracking Event Types

**Location:** `backend/src/server.js` - `POST /api/usage/log`

**Allowed Event Types:**

```javascript
const ALLOWED_EVENT_TYPES = ['table_activate', 'admin_refresh'];

// Validation in endpoint
if (!ALLOWED_EVENT_TYPES.includes(event_type)) {
  return res.status(400).json({ 
    error: 'Invalid event_type. Must be table_activate or admin_refresh' 
  });
}
```

### ⚠️ Critical Requirements

1. **Only 2 event types** are allowed:
   - `table_activate` - When user activates a property on the table
   - `admin_refresh` - When admin refreshes data from CARTO

2. **API enforces validation** - Rejects any other event type with 400 error

3. **Property linking** - When canvas_pid provided, automatically links to properties table

---

## Summary of Critical Patterns

| Component | Critical Requirement | Why It Matters |
|-----------|---------------------|----------------|
| Table Activation | Exact objectPath string | Unreal Engine blueprint reference |
| Table Activation | `uecmd` not `command` | Unreal Engine expects specific key |
| Table Activation | `JSON.stringify()` JSONParams | Unreal Engine expects string, not object |
| Table Activation | Full SQL query with all fields | Required by MarketCanvas widget |
| CARTO API | `String(row.CANVAS_PID)` | Prevents JavaScript precision loss |
| CARTO API | Transaction pattern | Ensures atomic updates |
| Database | canvas_pid as VARCHAR | Stores large numbers without precision loss |
| Usage Tracking | Only 2 event types allowed | Intentional limitation per requirements |

---

## When You Need to Modify Critical Code

1. **Create a backup first:**
   ```bash
   cp HomePage.jsx HomePage.jsx.backup
   ```

2. **Test in dev environment** before deploying to production

3. **Document any changes** to this file

4. **Verify with actual hardware** (the physical table)

5. **Have rollback plan** ready

---

## Testing Critical Functionality

### Test Table Activation
1. Select a property
2. Click "Activate Table"
3. Verify physical table displays property
4. Verify countdown modal appears
5. Verify usage log created in database

### Test Table Flatten
1. Click "Flatten Table"
2. Verify physical table resets to intro
3. Verify countdown modal appears
4. Verify NO usage log created (intentional)

### Test Data Refresh
1. Click "Refresh Data" in admin
2. Verify properties table updated
3. Verify usage log created with record count
4. Verify all canvas_pid values preserved correctly

---

**Last Updated:** November 10, 2025

**If you need to modify any of these patterns, please:**
1. Review this document carefully
2. Understand why the pattern exists
3. Test thoroughly before deploying
4. Update this document with any changes
