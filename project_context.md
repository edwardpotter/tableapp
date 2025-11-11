# Project Context Document

## Project Name
tableapp

## Project Overview
A single-page web application with client-server architecture, containerized with Docker for cross-platform deployment. The app stores relational data server-side, can make POST/PUT requests to external APIs, and provides property selection and table control functionality for an interactive experience center. Features include: property search with theme-aware map visualization, dark mode theme support, web content display, server management controls, admin-configurable settings with persistent storage, usage tracking for table activation and admin refresh events, and comprehensive analytics dashboard.

## Technology Stack

### Frontend
- **Framework:** React 19
- **Build Tool:** Vite 5
- **Styling:** Tailwind CSS 3.4
- **HTTP Client:** Axios
- **Icons:** lucide-react 0.454.0
- **Mapping:** Mapbox GL JS 3.0+ (for property location visualization)
- **Dev Server:** Vite dev server with HMR
- **Port:** 5173 (development)

### Backend
- **Runtime:** Node.js 20
- **Framework:** Express.js
- **Database Driver:** node-postgres (pg)
- **Middleware:** CORS, express.json()
- **Environment:** dotenv for configuration
- **Dev Tool:** nodemon for auto-restart
- **Port:** 3000

### Database
- **RDBMS:** PostgreSQL 15
- **Container:** postgres:15-alpine
- **Port:** 5432
- **Persistence:** Docker volume (postgres_data)

### DevOps
- **Containerization:** Docker
- **Orchestration:** Docker Compose
- **Version Control:** Git + GitHub
- **IDE:** VS Code on macOS

## Project Structure

```
tableapp/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx         # Navigation bar with theme toggle and admin access
│   │   │   ├── HomePage.jsx       # Property picker and table control interface
│   │   │   ├── AdminPage.jsx      # Administration screen with data refresh and analytics
│   │   │   ├── AdminModal.jsx     # Authentication modal for admin access
│   │   │   ├── LoadingModal.jsx   # Reusable loading indicator modal
│   │   │   ├── PropertyPicker.jsx # Property search, filter, and selection component
│   │   │   └── PropertyMap.jsx    # Mapbox GL map component for property location
│   │   ├── utils/                 # Helper functions (to be added)
│   │   ├── App.jsx                # Main application component with theme management
│   │   ├── App.css
│   │   ├── index.css              # Tailwind imports
│   │   └── main.jsx               # Entry point
│   ├── public/
│   ├── Dockerfile                 # Multi-stage: development + production
│   ├── nginx.conf                 # Production reverse proxy config
│   ├── vite.config.js             # Vite config with API proxy
│   ├── tailwind.config.js         # Tailwind CSS configuration
│   ├── postcss.config.js          # PostCSS with Tailwind + Autoprefixer
│   ├── package.json
│   └── package-lock.json
├── backend/
│   ├── src/
│   │   ├── routes/                # API routes (to be organized)
│   │   ├── models/                # Database models (to be added)
│   │   ├── controllers/           # Business logic (to be added)
│   │   └── server.js              # Express server with all endpoints
│   ├── Dockerfile                 # Node.js development container
│   ├── .env                       # Environment variables (not in git)
│   ├── package.json
│   └── package-lock.json
├── docker-compose.yml             # Multi-service orchestration
├── init.sql                       # Database initialization script
├── critical_code.md               # Reference for critical API call patterns
├── .gitignore                     # Git ignore rules
└── README.md                      # Project documentation
```

## Current Database Schema

### Tables

**properties**
- `id` - SERIAL PRIMARY KEY
- `canvas_pid` - VARCHAR(255) UNIQUE NOT NULL (stored as string to preserve precision)
- `primary_address` - TEXT
- `canvas_submarket` - VARCHAR(255)
- `property_class` - VARCHAR(255) (e.g., "A", "B", "C")
- `latitude` - DECIMAL(10, 8) (property latitude coordinate)
- `longitude` - DECIMAL(11, 8) (property longitude coordinate)
- `created_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- `updated_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP

**Indexes:**
- `idx_properties_canvas_pid` - Index on canvas_pid for faster lookups
- `idx_properties_location` - Composite index on (latitude, longitude) for geospatial queries

**usage_logs**
- `id` - SERIAL PRIMARY KEY
- `event_type` - VARCHAR(50) NOT NULL (only 'table_activate' or 'admin_refresh')
- `property_id` - INTEGER REFERENCES properties(id) ON DELETE SET NULL
- `canvas_pid` - VARCHAR(255) (denormalized for historical reference)
- `primary_address` - TEXT (denormalized for historical reference)
- `canvas_submarket` - VARCHAR(255) (denormalized for historical reference)
- `property_class` - VARCHAR(255) (denormalized for historical reference)
- `metadata` - JSONB (additional event data)
- `created_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP

**Indexes:**
- `idx_usage_logs_event_type` - Index on event_type for filtering
- `idx_usage_logs_created_at` - Index on created_at for date range queries
- `idx_usage_logs_canvas_pid` - Index on canvas_pid for property lookups
- `idx_usage_logs_property_id` - Index on property_id for foreign key joins

### Sample Data
- 6,500+ properties loaded from CARTO API (in production)
- Usage logs accumulated over time (2 event types only)

## API Endpoints

### Health & Configuration
- **GET** `/api/health`
  - Returns: `{ status: 'ok', message: 'Server is running' }`
- **GET** `/api/config`
  - Returns configuration values
  - Response: `{ countdownSeconds: number }`

### Properties Endpoints
- **GET** `/api/properties` - Get all properties with optional filters
  - Query params:
    - `search` - Filter by primary_address (case-insensitive ILIKE)
    - `submarket` - Filter by canvas_submarket (exact match)
    - `property_class` - Filter by property_class (exact match)
  - Returns: Array of property objects ordered by primary_address
- **GET** `/api/properties/submarkets` - Get unique submarkets
  - Returns: Array of unique submarket names
- **GET** `/api/properties/classes` - Get unique property classes
  - Returns: Array of unique property class values

### Usage Tracking Endpoints
- **POST** `/api/usage/log` - Log usage event
  - Body: `{ event_type: string, canvas_pid?: string, primary_address?: string, canvas_submarket?: string, property_class?: string, metadata?: object }`
  - Allowed event_types: 'table_activate', 'admin_refresh'
  - Returns: `{ success: boolean, log: object }`
  - Validates event type (returns 400 for invalid types)

- **GET** `/api/usage/analytics` - Get usage analytics
  - Query params:
    - `start_date` - ISO date string (optional)
    - `end_date` - ISO date string (optional)
    - `limit` - Number of results (optional)
  - Returns:
    ```json
    {
      "summary": {
        "total_events": number,
        "unique_properties_activated": number,
        "total_activations": number,
        "total_refreshes": number,
        "first_event": timestamp,
        "last_event": timestamp
      },
      "eventsByType": [{ "event_type": string, "count": number }],
      "topProperties": [{ "canvas_pid": string, "primary_address": string, "canvas_submarket": string, "property_class": string, "activation_count": number }],
      "activityByDay": [{ "date": date, "total_events": number, "activations": number, "refreshes": number }],
      "activityByHour": [{ "hour": number, "event_count": number }]
    }
    ```

- **GET** `/api/usage/recent` - Get recent usage logs
  - Query params:
    - `limit` - Number of logs to return (default: 50)
  - Returns: Array of usage log objects ordered by created_at DESC

### Admin Endpoints
- **POST** `/api/admin/authenticate` - Authenticate admin access
  - Body: `{ code: string }`
  - Returns: `{ success: boolean, message: string }`
  - Valid code: Environment variable `ADMIN_CODE` or "0710" default
- **POST** `/api/admin/refresh` - Trigger data refresh from CARTO API
  - Fetches property data from external CARTO API
  - Clears and repopulates properties table
  - Uses database transactions for data integrity
  - Automatically logs 'admin_refresh' event to usage_logs
  - Returns: `{ success: boolean, message: string, recordsProcessed: number }`

### Configuration Management
- **POST** `/api/admin/config` - Update configuration settings
  - Body: `{ showHtmlPanel: boolean }`
  - Returns: `{ success: boolean, message: string, showHtmlPanel: boolean }`
  - Behavior:
    - Updates process.env.SHOW_HTML_PANEL
    - Writes to backend/.env file
    - Preserves all other environment variables
    - Changes persist across server restarts

## Application Features

### User Interface

#### Navigation
- **Header Component**: Fixed navigation bar with:
  - Tab navigation (currently: Home tab)
  - Admin tab (visible only when on admin page)
  - Theme toggle button (Moon/Sun icon) for light/dark mode switching
  - Gear icon button (top-right) for admin access

#### Theme System
- **Light Mode**: Default theme with white backgrounds and dark text
- **Dark Mode**: Dark gray backgrounds (gray-900, gray-800) with light text
- **Toggle**: Moon icon (light mode) / Sun icon (dark mode) in header
- **Persistence**: Theme preference saved to localStorage
- **Coverage**: All components support both themes with appropriate color schemes

#### Pages

##### HomePage.jsx - Main interface with property control and web content display
  - Property picker with integrated action buttons
  - Show Web Content section (configurable via admin)
  - Full-width sections for better organization
  - Centered action buttons following consistent pattern
  - Countdown modals for operations (activate, flatten, display content)
  - Theme support throughout

##### AdminPage.jsx - Administration interface
  - Server Management section with restart controls:
    - Restart UE on Table
    - Restart UE on Screen  
    - Restart Table Server
    - Restart Screen Server
  - Data Management section with CARTO API refresh
  - Usage Analytics dashboard with date filtering
  - System Configuration section:
    - Show Web Content toggle
    - Persists changes to .env file
  - Theme support throughout

### Property Management

#### PropertyPicker.jsx - Property search, filter, and selection with action buttons
  - Search by address with real-time filtering
  - Filter by submarket and property class
  - Displays property details and map when selected
  - Action buttons at bottom (Activate Table, Flatten Table)
  - Centered button layout
  - Theme-aware styling

### Map Integration

#### PropertyMap.jsx - Theme-aware Mapbox map component
  - Accepts theme prop (light/dark)
  - Mapbox token from environment variable
  - Dynamic map style switching
  - Light mode: Streets v12 style
  - Dark mode: Dark v11 style
  - Blue marker for property location
  - Navigation controls
  - Initialized only when property selected

### Table Control Features

#### Activate Table
- **Requirements**: Property must be selected
- **Behavior**:
  - Makes PUT request to remote Unreal Engine endpoint
  - Sends complete preset configuration with:
    - Canvas PID for property identification
    - Latitude/longitude for map centering
    - Full SQL query for available stack data
    - Widget URLs for MarketCanvas embeds
    - Camera viewState configuration
  - Shows countdown modal with property details
  - Disables button after activation until different property selected
  - Logs successful activation to usage_logs
- **Modal**: Green theme, shows property ID, configurable countdown
- **API Call**: See critical_code.md for exact format

#### Flatten Table
- **Requirements**: None (always available)
- **Behavior**:
  - Makes PUT request to reset table to intro presentation
  - Shows countdown modal
  - Deselects any active property after completion
  - Resets application state to clean home screen
  - No usage logging (intentional)
- **Modal**: Blue theme, "Flattening Table..." message, configurable countdown
- **API Call**: See critical_code.md for exact format

#### Show Web Content (Admin-Configurable)
- **Location**: Home page (full-width section)
- **Features**:
  - URL input field (full-width)
  - Display Content button (centered below input)
  - Default URL: https://picsum.photos/1920
  - Displays web content on table via PUT request
  - Configurable visibility via SHOW_HTML_PANEL environment variable
  - Admin toggle in System Configuration section
  - No usage logging (intentional)
  - Theme-aware styling
- **API Integration**:
  - Endpoint: experience-center-room-dc-srv1.cbre.com/remote/object/call
  - Preset: "media"
  - URL position: pageContent.middle
  - View: "2d"

### Modal System

#### Admin Authentication Modal
- 4-digit numeric input (password type)
- Error handling for invalid codes
- Callbacks for authentication success/failure
- Theme-aware styling

#### Loading Modal
- Reusable component
- Spinning loader icon
- Customizable message prop
- Full-screen overlay
- Theme-aware styling

#### Countdown Modals
- Both Activate and Flatten operations use countdown modals
- Large countdown display (seconds remaining)
- Progress bar showing elapsed time
- Color-coded by operation type (green/blue/red)
- Error state handling with detailed messages
- Non-dismissible until countdown completes
- Configurable duration via environment variable
- Theme-aware styling

### Server Management (Admin Only)
  - **Location**: Admin page (before Data Management)
  - **Features**:
    - 4 server action buttons:
      - Restart UE on Table (purple)
      - Restart UE on Screen (purple)
      - Restart Table Server (orange)
      - Restart Screen Server (orange)
    - Confirmation modal for all actions
    - Currently logs to console (backend implementation pending)
    - Theme-aware styling

### System Configuration (Admin Only)
  - **Location**: Admin page (after Usage Analytics)
  - **Features**:
    - Show Web Content checkbox toggle
    - Updates backend/.env file directly
    - Changes persist across server restarts
    - Loading indicator during updates
    - Error handling for file write failures
    - Theme-aware styling

## Configuration Files

### frontend/vite.config.js
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://backend:3000',
        changeOrigin: true,
      }
    }
  }
})
```

### frontend/package.json (key dependencies)
```json
{
  "dependencies": {
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "axios": "^1.6.0",
    "lucide-react": "^0.454.0",
    "mapbox-gl": "^3.0.0"
  }
}
```

### Frontend (.env)
```bash
# Mapbox API Token
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

**Note:** In Vite, environment variables must be prefixed with `VITE_` to be exposed to client-side code.

### backend/.env
```
PORT=3000
DB_HOST=postgres
DB_PORT=5432
DB_NAME=myapp
DB_USER=postgres
DB_PASSWORD=postgres
ADMIN_CODE=0710
COUNTDOWN_SECONDS=120
# Feature Toggles
SHOW_HTML_PANEL=TRUE              # Controls Show Web Content section visibility
```

**Environment Variables:**
- `PORT` - Backend server port (default: 3000)
- `DB_HOST` - Database host (docker service name: postgres)
- `DB_PORT` - Database port (default: 5432)
- `DB_NAME` - Database name
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `ADMIN_CODE` - Admin authentication code (default: 0710)
- `COUNTDOWN_SECONDS` - Modal countdown duration in seconds (default: 120)

### docker-compose.yml Services
1. **postgres** - PostgreSQL database with health check
2. **backend** - Express API server with hot reload
3. **frontend** - Vite dev server with hot reload

All services connected via Docker network, with volume mounts for development hot-reloading.

## External API Integration

### CARTO API
**Purpose:** Fetch property data for DC region office buildings

**Endpoint:** `https://gcp-us-east1.api.carto.com/v3/sql/us_svc_canvas_carto/query`

**Authentication:** Bearer token (stored in server.js)

**Query Details:**
- Fetches distinct properties from PROD_CANVAS_DB.DATA.CANVAS_PROPERTIES
- Filters by canvas_region_id = 8491580179800618632 (DC region)
- Property type = 'Office'
- Only returns one property per unique address (DISTINCT ON PRIMARY_ADDRESS)
- Excludes properties with null property_class
- Returns fields: canvas_pid, primary_address, canvas_submarket, property_class, latitude, longitude

**Response Format:**
```json
{
  "rows": [
    {
      "CANVAS_PID": 2845212105411697000,
      "PRIMARY_ADDRESS": "Wootton Pky",
      "CANVAS_SUBMARKET": "Rockville",
      "PROPERTY_CLASS": "A",
      "LATITUDE": 39.0875,
      "LONGITUDE": -77.2014
    }
  ],
  "schema": [...],
  "meta": {}
}
```

**Data Handling:**
- Canvas PID converted to string to preserve large number precision
- Field names are UPPERCASE in API response
- Null values handled gracefully with fallbacks

### Experience Center Remote API
**Purpose:** Control interactive table display in experience center

**Endpoint:** `https://experience-center-room-dc-srv1.cbre.com/remote/object/call`

**Method:** PUT

**Authentication:** None (internal network)

**Request Structure:**
```json
{
  "objectPath": "/Game/CBRE_MC/PinTable/PinTable_Cesium_Mockup.PinTable_Cesium_Mockup:PersistentLevel.BP_CameraRig_C_UAID_047C16D0FB2829DF01_1089232868",
  "functionName": "RemoteWebCommand",
  "parameters": {
    "JSONParams": "{\"uecmd\":\"ShowUnrealPreset\",\"parameters\":{...}}"
  }
}
```

**Commands:**

1. **ShowUnrealPreset - Property Activation**
   - Preset: "properties_overview_map"
   - View: "3d"
   - Dynamic parameters: canvas_pid, latitude, longitude, SQL queries, widget URLs
   - Displays property with map and photos
   - Full implementation in critical_code.md

2. **ShowUnrealPreset - Flatten Table**
   - Preset: "intro"
   - View: "2d"
   - Shows presentation slide
   - Resets table to default state
   - Full implementation in critical_code.md

**CRITICAL:** See `critical_code.md` for exact API call formats. These patterns must be preserved exactly as documented.

### Mapbox API
**Purpose:** Display interactive street maps with property locations

**Service:** Mapbox GL JS v3.0+

**Authentication:** Access token (stored in PropertyMap.jsx)
- **Format**: Starts with `pk.` for public access
- **Acquisition**: Free tier available at https://account.mapbox.com/
- **Usage**: Embedded in PropertyMap component

**Features Used:**
- Streets v12 map style (clean, readable)
- Marker API (blue pins for property locations)
- Navigation controls (zoom in/out buttons)
- Interactive pan and zoom
- Geocoding via latitude/longitude

**Configuration:**
```javascript
mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN';

const map = new mapboxgl.Map({
  container: mapContainerRef.current,
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [longitude, latitude],
  zoom: 15,
  attributionControl: false
});

const marker = new mapboxgl.Marker({ color: '#2563eb' })
  .setLngLat([longitude, latitude])
  .addTo(map);
```

**Best Practices:**
- Store token in environment variable for production
- Use `.env` file: `VITE_MAPBOX_TOKEN=your_token_here`
- Access via: `import.meta.env.VITE_MAPBOX_TOKEN`
- Set domain restrictions in Mapbox dashboard for security

## Docker Commands

### Development
```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up --build

# Reset database (clears all data)
docker-compose down -v

# Install dependencies in container
docker-compose exec frontend npm install <package>
docker-compose exec backend npm install <package>
```

### Access Points
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- PostgreSQL: localhost:5432

## Development Workflow

1. **Start environment:** `docker-compose up`
2. **Code changes:** Edit files in `frontend/src/` or `backend/src/`
3. **Auto-reload:** Changes reflected automatically (hot module replacement)
4. **Database changes:** Modify `init.sql` and run `docker-compose down -v && docker-compose up`
5. **New dependencies:** Use `docker-compose exec [service] npm install <package>` or rebuild
6. **Environment changes:** Update `.env` and restart: `docker-compose restart backend`
7. **Commit changes:** Use VS Code Source Control or `git add/commit/push`

## Key Features & Capabilities

### Implemented
- ✅ Full-stack containerized environment
- ✅ React frontend with Tailwind CSS
- ✅ Express REST API
- ✅ PostgreSQL with relational data
- ✅ Docker Compose orchestration
- ✅ Hot reload for frontend and backend
- ✅ API proxy from frontend to backend
- ✅ Git version control with GitHub
- ✅ Tabbed navigation interface
- ✅ **Dark mode theme system with toggle**
- ✅ **Theme persistence via localStorage**
- ✅ Admin authentication system (4-digit code)
- ✅ Admin page with data refresh functionality
- ✅ Modal-based authentication flow
- ✅ Confirmation modals for admin actions
- ✅ External API integration (CARTO)
- ✅ Database transaction handling
- ✅ Property data management (6,500+ properties)
- ✅ Property picker with search and filters
- ✅ Real-time property filtering by:
  - Address (fuzzy search)
  - Submarket (exact match)
  - Property class (exact match)
- ✅ **Interactive map visualization (Mapbox)**
- ✅ **Property location display with markers**
- ✅ **1:1 ratio map in selected property card**
- ✅ Remote table control integration
- ✅ Property activation on physical table
- ✅ Table flatten/reset functionality
- ✅ Countdown timers with progress bars
- ✅ Configurable timer duration via environment
- ✅ Error handling for API calls
- ✅ Loading states and user feedback
- ✅ Geospatial data (latitude/longitude)
- ✅ Dynamic map centering based on property location
- ✅ Usage tracking system (2 event types)
- ✅ Usage analytics dashboard
- ✅ Date-range filtered analytics
- ✅ Activity visualization (hourly patterns)
- ✅ Top properties reporting

### To Be Implemented
- ⏳ Additional table operation functions
- ⏳ Admin functions for remote server restarts
- ⏳ Creation and navigatable playback of saved property list for table activations
- ⏳ Production deployment configuration

## Dependencies

### Frontend (package.json)
```json
{
  "dependencies": {
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "axios": "^1.6.0",
    "lucide-react": "^0.454.0",
    "mapbox-gl": "^3.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.8",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

### Backend (package.json)
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

## Environment Details
- **OS:** macOS
- **Editor:** VS Code
- **Node Version:** 20 (in Docker containers)
- **Docker:** Docker Desktop for Mac
- **Git Remote:** GitHub

## Security Notes
- Admin authentication code configurable via `ADMIN_CODE` environment variable
- Default admin code: "0710" (should be changed for production)
- **TODO**: Move CARTO API token to environment variable
- **TODO**: Move Mapbox token to environment variable for production
- `.env` files are gitignored for security
- Database credentials should be changed for production
- External API calls use HTTPS
- CORS configured for development environment
- Usage logging does not capture PII
- Mapbox tokens should be domain-restricted in production

## Data Flow

### Property Data Refresh Flow
1. Admin clicks "Refresh Data" button
2. Confirmation modal appears
3. Admin confirms action
4. Backend makes GET request to CARTO API
5. API returns JSON with property data (UPPERCASE field names)
6. Backend starts database transaction
7. Existing properties deleted
8. New properties inserted (canvas_pid converted to string)
9. Transaction committed
10. Usage log created with 'admin_refresh' event
11. Success response with record count
12. Frontend displays success modal
13. Analytics refresh automatically

### Property Selection Flow
1. User types in search box
2. Frontend filters local property list
3. User applies submarket/class filters
4. Results update in real-time
5. User clicks property from dropdown
6. Property details displayed in blue card **with map**
7. **Map initializes with property's coordinates**
8. **Blue marker appears at property location**
9. "Activate Table" button becomes available
10. Property data stored in component state

### Table Activation Flow
1. User selects property (sees location on map)
2. User clicks "Activate Table"
3. Frontend prepares PUT request with:
   - canvas_pid
   - latitude/longitude (from property data)
   - Full SQL query with property filter
   - Widget URLs with canvas_pid
   - Camera viewState configuration
4. PUT request sent to remote endpoint
5. Success: Usage log created with 'table_activate' event
6. Countdown modal displays with property info
7. After countdown: button disabled for that property
8. User must select different property to reactivate

### Table Flatten Flow
1. User clicks "Flatten Table" (any time)
2. Frontend prepares PUT request with intro preset
3. PUT request sent to remote endpoint
4. Countdown modal displays "Flattening Table..."
5. No usage logging (intentional)
6. After countdown:
   - Modal closes
   - Selected property cleared (map disappears)
   - Last activated property cleared
   - Returns to clean home state

### Theme Toggle Flow
1. User clicks Moon/Sun icon in header
2. Theme state toggles (light ↔ dark)
3. New theme saved to localStorage
4. All components re-render with new theme
5. CSS classes update throughout app
6. Theme persists on page refresh/browser restart

## Technical Implementation Details

### Theme System Implementation
**State Management:**
- Theme state managed in App.jsx (`'light'` or `'dark'`)
- Passed as prop to all components that need theming
- localStorage used for persistence across sessions

**Styling Approach:**
- Conditional Tailwind classes based on theme prop
- Pattern: `className={theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`
- All interactive elements adapt to both themes
- Maintains WCAG AA contrast standards in both modes

**Color Scheme:**
- Light mode: White/Gray-50 backgrounds, dark text
- Dark mode: Gray-900/Gray-800 backgrounds, light text
- Accent colors (blue, green) remain consistent
- Borders and dividers adjust for each theme

**Performance:**
- Single state change updates entire app
- No full page reload required
- Efficient re-rendering (only styled components update)
- localStorage write is synchronous and minimal

### Map Integration Implementation
**Initialization:**
- Map component only mounts when property selected
- Single map instance created on first render
- Reuses same instance when changing properties

**Updates:**
- Center and marker update without recreating map
- Smooth transitions between property locations
- Cleanup on component unmount prevents memory leaks

**Coordinates:**
- Uses property's latitude/longitude from database
- Fallback to DC center (38.905172, -77.0046697) if missing
- 15x zoom provides street-level detail

**Styling:**
- 200x200px square (1:1 ratio)
- Rounded corners match card design
- Overflow hidden for clean appearance
- Blue marker (#2563eb) matches UI accent color

### Large Number Handling
- Canvas PIDs are very large integers (19 digits)
- JavaScript cannot safely handle integers > 2^53 - 1
- Solution: Convert to string immediately: `String(row.CANVAS_PID)`
- Database stores as VARCHAR(255) instead of BIGINT

### Database Transactions
- Admin refresh uses BEGIN/COMMIT/ROLLBACK
- Ensures atomic operations (all or nothing)
- Prevents partial data updates on error
- Connection properly released in finally block

### API Response Parsing
- CARTO returns UPPERCASE field names
- Backend maps: CANVAS_PID → canvas_pid, etc.
- Frontend receives snake_case field names
- Null values handled with || fallbacks

### Countdown Timer Implementation
- Uses React useEffect with setTimeout
- Decrements state every 1000ms
- Progress bar calculated: `(elapsed / total) * 100%`
- Non-blocking (doesn't freeze UI)
- Cleanup function prevents memory leaks
- Configurable via backend config endpoint

### Modal Management
- Z-index layering for proper stacking
- Click-outside detection for dropdowns
- Scroll lock when modals open
- Separate state for each modal type
- Error states integrated into same modal
- Theme-aware rendering

### Usage Tracking Implementation
- Only 2 event types tracked: 'table_activate' and 'admin_refresh'
- Backend enforces event type validation (400 error for others)
- Asynchronous logging (doesn't block main operations)
- Property data denormalized for historical reference
- Metadata stored as JSONB for flexibility
- Indexes optimized for common query patterns

## Common Tasks & Solutions

### Adding a New Property Filter
1. Update backend `/api/properties` endpoint with new query parameter
2. Add filter state to PropertyPicker component
3. Add dropdown/input in UI
4. Update filtering logic in useEffect
5. Test with various filter combinations
6. Ensure theme support for new UI elements

### Changing Countdown Duration
1. Update `COUNTDOWN_SECONDS` in `backend/.env`
2. Restart backend: `docker-compose restart backend`
3. Frontend automatically fetches new value

### Changing Map Style
1. Edit PropertyMap.jsx
2. Change `style` parameter to different Mapbox style
3. Options: streets-v12, satellite-streets-v12, dark-v11, light-v11
4. Example: `style: 'mapbox://styles/mapbox/dark-v11'`

### Customizing Theme Colors
1. Edit conditional classes in components
2. Change Tailwind color values (e.g., gray-800 → gray-900)
3. Test in both light and dark modes
4. Verify contrast ratios for accessibility
5. Update multiple components if changing global scheme

### Modifying Table Commands
⚠️ **CAUTION**: Table activation and flatten commands use very specific API formats
1. Review `critical_code.md` before making ANY changes
2. Test with actual hardware (physical table)
3. Use exact objectPath, functionName, and JSONParams structure
4. Preserve JSON.stringify() usage
5. Do not change 'uecmd' or 'parameters' keys

### Troubleshooting Property Data Issues
1. Check Docker logs: `docker-compose logs backend`
2. Verify CARTO API response structure
3. Check field name mappings (UPPERCASE → snake_case)
4. Verify canvas_pid string conversion
5. Check database constraints and indexes

### Troubleshooting Map Issues
1. Verify Mapbox token is valid and set
2. Check browser console for Mapbox errors
3. Ensure property has valid latitude/longitude
4. Verify mapbox-gl CSS is imported
5. Check map container has dimensions (width/height)
6. Test in different browsers for WebGL support

### Debugging Remote API Calls
1. Open browser DevTools Network tab
2. Look for PUT requests to experience-center-room-dc-srv1.cbre.com
3. Check request payload structure
4. Verify JSONParams is valid JSON string (use JSON.parse to test)
5. Check console logs for detailed error messages

### Viewing Usage Analytics
1. Navigate to Admin page
2. Select date range filter
3. View summary cards for key metrics
4. Check "Most Activated Properties" table
5. Review activity by hour chart for usage patterns
6. Click "View Recent Activity Log" for detailed event list

## Future Enhancements

### Short-term
1. Export analytics data as CSV/Excel
2. Email reports on weekly/monthly basis
3. Session management for admin login
4. Additional usage event types (if needed)
5. Property detail page with expanded info
6. System dark mode preference detection
7. Multiple map style options (satellite, terrain)

### Medium-term
1. Property comparison features
2. User favorites/bookmarks
3. Advanced geospatial filters (radius search)
4. Real-time analytics updates
5. Presentation mode
6. Driving directions to properties
7. Street view integration

### Long-term
1. Multi-location support
2. Predictive analytics for property trends
3. Integration with CRM systems
4. Mobile app for table control
5. Machine learning for property recommendations
6. Heat maps for property density
7. Custom map overlays (zones, districts)

## Notes
- Database data persists in Docker volume `postgres_data`
- Frontend uses proxy to avoid CORS issues in development
- Production build uses Nginx to serve frontend and reverse proxy API
- All timestamps are UTC
- React 19 requires compatible library versions (use --legacy-peer-deps if needed)
- Admin page designed to be extensible for future administrative functions
- Property data refreshed manually via admin panel
- Remote API calls require internal network access
- Countdown timer prevents overworking the table motors
- Property selection state managed entirely client-side
- No user authentication for general use (open access to property picker)
- Usage tracking is non-intrusive (failures don't break main functionality)
- Only 2 event types tracked to keep analytics focused and performant
- **Map requires valid Mapbox access token to function**
- **Map requires WebGL support in browser (Chrome 56+, Firefox 49+, Safari 10.1+, Edge 79+)**
- **Theme preference persists across browser sessions via localStorage**
- **Dark mode meets WCAG AA contrast standards**

## Critical Code Reference
**IMPORTANT**: The file `critical_code.md` contains exact API call patterns for:
- Table activation (Unreal Engine API)
- Table flatten (Unreal Engine API)
- CARTO data refresh
- Database schema requirements

**Before modifying any table control code, ALWAYS review critical_code.md first.**

These patterns have been tested with actual hardware and external systems. Any deviation will break functionality.

---

**Last Updated:** November 10, 2025

**Version:** 3.0.0 (Added Mapbox map integration, dark mode theme system, updated all components)

**Major Changes in v3.0.0:**
- Added interactive Mapbox street map to selected property display
- Implemented dark mode theme with light/dark toggle
- Added theme persistence via localStorage
- Updated all components for theme support
- Added PropertyMap component for map rendering
- Enhanced PropertyPicker with map visualization
- Improved UX with visual property location feedback

**Last Updated:** November 11, 2025

**Version:** 3.5.0

**Major Changes in v3.5.0:**
- Added Mapbox token environment variable (VITE_MAPBOX_TOKEN)
- Implemented theme-aware map styles (streets-v12 / dark-v11)
- Added Server Management section to Admin page (4 restart buttons)
- Renamed Show URL Content to Show Web Content
- Moved Show Web Content section to full-width, top of home page
- Moved action buttons into section layouts (centered at bottom)
- Enhanced configuration management with .env file updates
- Renamed Configuration section to System Configuration
- Updated all component descriptions for consistency

**Components Modified:**
- PropertyMap.jsx - Theme support, environment variable
- PropertyPicker.jsx - Integrated action buttons
- HomePage.jsx - Layout changes, button relocations
- AdminPage.jsx - Server Management, System Configuration updates
- server.js - Enhanced config endpoint with .env writing

**Documentation Updated:**
- critical_code.md - Added Show Web Content API call
- project_context.md - Comprehensive updates throughout

**Use this document to provide context in future conversations about this project.**