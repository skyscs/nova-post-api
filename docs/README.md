# NovaPost API Documentation

**Version**: 2.0.0  
**Base URL**: `http://localhost:3001/api/v1`  
**Documentation**: Available at `/docs` (Swagger UI)

## 🎯 Overview

NovaPost API provides comprehensive access to Ukrainian postal service data with complete regional hierarchy, geospatial search, and hierarchical navigation from countries to specific postal divisions.

### Key Features
- **259,123 postal divisions** across 22 countries
- **575 administrative regions** (oblasts, départements, voivodeships, states)
- **Hierarchical navigation**: Country → Region → City → Division
- **Geospatial search** with coordinates and radius
- **99% regional accuracy** (fixed "Unknown Region" problem)
- **Complete city information** with all postal divisions

## 🚀 Quick Start

### Start the API Server
```bash
# Install dependencies
bun install

# Start PostgreSQL
docker-compose up -d postgres

# Run migrations
bun run src/database/migrate.ts

# Start server
bun run dev

# API available at: http://localhost:3001
# Documentation at: http://localhost:3001/docs
```

### First API Call
```bash
# Get system health
curl "http://localhost:3001/api/v1/system/health"

# Find nearby divisions
curl "http://localhost:3001/api/v1/divisions/nearby?lat=50.4501&lng=30.5234&radius=5"

# Get all countries
curl "http://localhost:3001/api/v1/divisions/countries"
```

## 📖 Complete API Reference

### 🏢 Divisions API

#### Find Nearby Divisions
```http
GET /api/v1/divisions/nearby?lat={latitude}&lng={longitude}&radius={km}
```

**Parameters:**
- `lat` (required) - Latitude coordinate
- `lng` (required) - Longitude coordinate  
- `radius` (optional) - Search radius in kilometers (default: 5)
- `limit` (optional) - Maximum results (default: 50)

**Example:**
```bash
curl "http://localhost:3001/api/v1/divisions/nearby?lat=50.4501&lng=30.5234&radius=10&limit=10"
```

#### Search Divisions
```http
GET /api/v1/divisions/search?query={search_term}
```

**Parameters:**
- `query` (required) - Search term for division name or address
- `country` (optional) - Filter by country code (e.g., "UA", "FR")
- `limit` (optional) - Maximum results (default: 50)
- `offset` (optional) - Results offset for pagination (default: 0)

**Example:**
```bash
curl "http://localhost:3001/api/v1/divisions/search?query=Київ&country=UA&limit=20"
```

#### Get Division by ID
```http
GET /api/v1/divisions/{id}
```

**Example:**
```bash
curl "http://localhost:3001/api/v1/divisions/1"
```

#### Get All Countries
```http
GET /api/v1/divisions/countries
```

Returns list of all countries with postal divisions.

**Example:**
```bash
curl "http://localhost:3001/api/v1/divisions/countries"
```

### 🗺️ Parent Regions API

#### List Parent Regions
```http
GET /api/v1/parent-regions
```

**Parameters:**
- `country` (optional) - Filter by country code (e.g., "UA", "FR", "PL")
- `limit` (optional) - Maximum results (default: 50)
- `offset` (optional) - Results offset for pagination (default: 0)

**Examples:**
```bash
# All regions
curl "http://localhost:3001/api/v1/parent-regions"

# Ukrainian oblasts only
curl "http://localhost:3001/api/v1/parent-regions?country=UA"

# French départements with pagination
curl "http://localhost:3001/api/v1/parent-regions?country=FR&limit=20&offset=40"
```

#### Regional Statistics
```http
GET /api/v1/parent-regions/stats
```

Returns statistics of regions by country.

**Example:**
```bash
curl "http://localhost:3001/api/v1/parent-regions/stats"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "country_code": "FR",
      "country_name": "France", 
      "region_count": 109
    },
    {
      "country_code": "UA",
      "country_name": "Ukraine",
      "region_count": 25
    }
  ]
}
```

#### Get Region by ID
```http
GET /api/v1/parent-regions/{id}
```

**Example:**
```bash
curl "http://localhost:3001/api/v1/parent-regions/23"
```

#### Get Cities in Region
```http
GET /api/v1/parent-regions/{id}/cities
```

Returns all cities within a specific parent region.

**Parameters:**
- `limit` (optional) - Maximum results (default: 50)
- `offset` (optional) - Results offset for pagination (default: 0)

**Example:**
```bash
# All cities in Kyiv Oblast (ID: 23)
curl "http://localhost:3001/api/v1/parent-regions/23/cities"

# With pagination
curl "http://localhost:3001/api/v1/parent-regions/23/cities?limit=20&offset=40"
```

### 🏙️ Cities API

#### Get Divisions in City
```http
GET /api/v1/cities/{id}/divisions
```

Returns all postal divisions within a specific city.

**Parameters:**
- `limit` (optional) - Maximum results (default: 50)
- `offset` (optional) - Results offset for pagination (default: 0)

**Example:**
```bash
# All divisions in Kyiv (ID: 420)
curl "http://localhost:3001/api/v1/cities/420/divisions"

# With pagination
curl "http://localhost:3001/api/v1/cities/420/divisions?limit=20&offset=100"
```

**Response for Kyiv:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nova_id": 1,
      "name": "Відділення №1 (до 30 кг): вул. Хрещатик, 22",
      "address": "02000, м. Київ, вул. Хрещатик, 22",
      "coordinates": {
        "lat": 50.4501,
        "lng": 30.5234
      },
      "phone": "+380442391111",
      "schedule": "Пн-Пт: 8:00-20:00, Сб: 9:00-18:00",
      "status": "active",
      "weight_limit": 30,
      "city": {
        "id": 420,
        "name": "Київ",
        "parent_region": {
          "id": 24,
          "name": "м. Київ",
          "country_code": "UA"
        }
      }
    }
  ],
  "pagination": {
    "total": 434,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

### 🔧 System API

#### System Health
```http
GET /api/v1/system/health
```

Returns system health status.

#### Database Statistics
```http
GET /api/v1/system/stats
```

Returns database statistics including counts of divisions, cities, regions.

#### Update History
```http
GET /api/v1/system/updates
```

Returns history of database updates.

#### Trigger Update
```http
POST /api/v1/system/update
```

Triggers manual database update from NovaPost API.

## 🌍 Navigation Patterns

### 1. Hierarchical Navigation
Complete navigation from country to specific postal division:

```javascript
// 1. Get all countries
const countries = await fetch('/api/v1/divisions/countries');
console.log('Available countries:', countries.data.length);

// 2. Get regions for Ukraine
const regions = await fetch('/api/v1/parent-regions?country=UA');
console.log('Ukrainian oblasts:', regions.data.length); // 25 oblasts

// 3. Get cities in Kyiv Oblast (ID: 23)
const cities = await fetch('/api/v1/parent-regions/23/cities');
console.log('Cities in Kyiv Oblast:', cities.pagination.total);

// 4. Get divisions in Kyiv (ID: 420)
const divisions = await fetch('/api/v1/cities/420/divisions');
console.log('Postal divisions in Kyiv:', divisions.pagination.total); // 434
```

### 2. Direct City Access
Direct access to city's postal infrastructure:

```javascript
async function getCityPostalInfo(cityId) {
    const response = await fetch(`/api/v1/cities/${cityId}/divisions`);
    const data = await response.json();
    
    if (data.success) {
        console.log(`City has ${data.pagination.total} postal divisions`);
        return data.data;
    }
    return [];
}

// Example: Get all postal divisions in Kyiv
const kyivDivisions = await getCityPostalInfo(420);
```

### 3. Regional Analysis
Analyze postal coverage by administrative regions:

```javascript
async function analyzeRegionalCoverage() {
    // Get regional statistics
    const stats = await fetch('/api/v1/parent-regions/stats');
    console.log('Regional coverage by country:', stats.data);
    
    // Detailed analysis for Ukraine
    const ukraineRegions = await fetch('/api/v1/parent-regions?country=UA');
    
    for (const region of ukraineRegions.data) {
        const cities = await fetch(`/api/v1/parent-regions/${region.id}/cities`);
        console.log(`${region.name}: ${cities.pagination.total} cities`);
    }
}
```

### 4. Geospatial Search
Find nearby postal services:

```javascript
async function findNearbyPostal(lat, lng, radius = 5) {
    const response = await fetch(
        `/api/v1/divisions/nearby?lat=${lat}&lng=${lng}&radius=${radius}`
    );
    const data = await response.json();
    
    if (data.success) {
        console.log(`Found ${data.data.length} divisions within ${radius}km`);
        return data.data;
    }
    return [];
}

// Example: Find postal divisions near center of Kyiv
const nearbyDivisions = await findNearbyPostal(50.4501, 30.5234, 10);
```

## 💻 Code Examples

### JavaScript/Node.js

#### Complete API Client
```javascript
class NovaPostClient {
    constructor(baseUrl = 'http://localhost:3001/api/v1') {
        this.baseUrl = baseUrl;
    }
    
    async request(endpoint) {
        const response = await fetch(`${this.baseUrl}${endpoint}`);
        const data = await response.json();
        return data.success ? data : null;
    }
    
    // Get divisions near coordinates
    async findNearby(lat, lng, radius = 5) {
        return this.request(`/divisions/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
    }
    
    // Get all regions for country
    async getRegions(countryCode) {
        return this.request(`/parent-regions?country=${countryCode}`);
    }
    
    // Get cities in region
    async getCitiesInRegion(regionId) {
        return this.request(`/parent-regions/${regionId}/cities`);
    }
    
    // Get divisions in city
    async getDivisionsInCity(cityId) {
        return this.request(`/cities/${cityId}/divisions`);
    }
    
    // Search divisions
    async searchDivisions(query, country = null) {
        const countryParam = country ? `&country=${country}` : '';
        return this.request(`/divisions/search?query=${query}${countryParam}`);
    }
}

// Usage example
const client = new NovaPostClient();

// Find postal divisions near Kyiv center
const nearby = await client.findNearby(50.4501, 30.5234, 10);
console.log(`Found ${nearby.data.length} nearby divisions`);

// Get all Ukrainian oblasts
const ukraineRegions = await client.getRegions('UA');
console.log(`Ukraine has ${ukraineRegions.data.length} oblasts`);

// Get all postal divisions in Kyiv
const kyivDivisions = await client.getDivisionsInCity(420);
console.log(`Kyiv has ${kyivDivisions.pagination.total} postal divisions`);
```

#### Pagination Helper
```javascript
async function getAllResults(endpoint, params = {}) {
    const results = [];
    let offset = 0;
    const limit = 100;
    
    while (true) {
        const url = new URL(`http://localhost:3001/api/v1${endpoint}`);
        Object.entries({...params, limit, offset}).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.success || !data.data.length) break;
        
        results.push(...data.data);
        
        if (!data.pagination?.hasMore) break;
        offset += limit;
    }
    
    return results;
}

// Usage: Get all cities in Kyiv Oblast
const allCities = await getAllResults('/parent-regions/23/cities');
console.log(`Total cities in Kyiv Oblast: ${allCities.length}`);
```

### Python

#### Basic Client
```python
import requests
from typing import Optional, List, Dict, Any

class NovaPostClient:
    def __init__(self, base_url: str = "http://localhost:3001/api/v1"):
        self.base_url = base_url
    
    def _request(self, endpoint: str) -> Optional[Dict[str, Any]]:
        response = requests.get(f"{self.base_url}{endpoint}")
        data = response.json()
        return data if data.get('success') else None
    
    def find_nearby(self, lat: float, lng: float, radius: int = 5) -> Optional[List[Dict]]:
        """Find divisions near coordinates"""
        result = self._request(f"/divisions/nearby?lat=${lat}&lng=${lng}&radius=${radius}")
        return result['data'] if result else None
    
    def get_regions(self, country_code: str) -> Optional[List[Dict]]:
        """Get all regions for country"""
        result = self._request(f"/parent-regions?country=${country_code}")
        return result['data'] if result else None
    
    def get_cities_in_region(self, region_id: int) -> Optional[List[Dict]]:
        """Get cities in region"""
        result = self._request(f"/parent-regions/${region_id}/cities")
        return result['data'] if result else None

# Usage example
client = NovaPostClient()

# Find nearby divisions
nearby = client.find_nearby(50.4501, 30.5234, 10)
print(f"Found {len(nearby)} nearby divisions")

# Get Ukrainian oblasts
ukraine_regions = client.get_regions('UA')
print(f"Ukraine has {len(ukraine_regions)} oblasts")

# Analyze regions
for region in ukraine_regions:
    cities = client.get_cities_in_region(region['id'])
    print(f"{region['name']}: {len(cities)} cities")
```

### cURL Examples

#### Basic Operations
```bash
# Get system health
curl -X GET "http://localhost:3001/api/v1/system/health"

# Find divisions near Kyiv
curl -X GET "http://localhost:3001/api/v1/divisions/nearby?lat=50.4501&lng=30.5234&radius=10"

# Search for divisions in Kyiv
curl -X GET "http://localhost:3001/api/v1/divisions/search?query=Київ&country=UA"

# Get all countries
curl -X GET "http://localhost:3001/api/v1/divisions/countries" | jq '.data[] | .country_code'
```

#### Regional Operations
```bash
# Get all Ukrainian oblasts
curl -X GET "http://localhost:3001/api/v1/parent-regions?country=UA" | jq '.data[] | .name'

# Get regional statistics
curl -X GET "http://localhost:3001/api/v1/parent-regions/stats" | jq '.data'

# Get cities in Kyiv Oblast
curl -X GET "http://localhost:3001/api/v1/parent-regions/23/cities?limit=10" | jq '.pagination'

# Get divisions in Kyiv
curl -X GET "http://localhost:3001/api/v1/cities/420/divisions?limit=5" | jq '.data[0] | {name, address, phone}'
```

## 📊 Data Structure

### Division Object
```json
{
  "id": 1,
  "nova_id": 1,
  "name": "Відділення №1 (до 30 кг): вул. Хрещатик, 22",
  "address": "02000, м. Київ, вул. Хрещатик, 22",
  "coordinates": {
    "lat": 50.4501,
    "lng": 30.5234
  },
  "phone": "+380442391111",
  "schedule": "Пн-Пт: 8:00-20:00, Сб: 9:00-18:00",
  "status": "active",
  "weight_limit": 30,
  "city": {
    "id": 420,
    "name": "Київ",
    "parent_region": {
      "id": 24,
      "name": "м. Київ",
      "country_code": "UA"
    }
  }
}
```

### Parent Region Object
```json
{
  "id": 23,
  "nova_id": 123,
  "name": "Київська область",
  "country_code": "UA",
  "cities_count": 156,
  "created_at": "2025-06-05T10:00:00Z",
  "updated_at": "2025-06-05T10:00:00Z"
}
```

### Pagination Object
```json
{
  "total": 434,
  "limit": 50,
  "offset": 0,
  "hasMore": true
}
```

## 🔧 Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/nova_post
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=nova_post
DATABASE_USER=postgres
DATABASE_PASSWORD=password

# NovaPost API
NOVA_POST_API_URL=https://api.novaposhta.ua/v2.0/json/

# Server
PORT=3001
NODE_ENV=development
```

### Docker Setup
```yaml
version: '3.8'
services:
  postgres:
    image: postgis/postgis:14-3.2
    environment:
      POSTGRES_DB: nova_post
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  api:
    build: .
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/nova_post
      NOVA_POST_API_URL: https://api.novaposhta.ua/v2.0/json/
    depends_on:
      - postgres
```

## 🚀 Force Update System

### CLI Commands
```bash
# Complete database refresh (recommended for major updates)
bun run src/cli/update.ts force-update

# Refresh with limit (for testing)
bun run src/cli/update.ts force-update-api 1000

# Clear all database data
bun run src/cli/update.ts clear-all

# Show help and current statistics
bun run src/cli/update.ts
```

### Update Process
1. **Backup Current Data** - Previous data preserved
2. **Clear Tables** - Remove old data (except configuration)
3. **Fetch from NovaPost** - Get latest data from official API
4. **Process & Validate** - Extract regions, link cities, validate coordinates
5. **Update Database** - Insert new data with transactions
6. **Verify Integrity** - Check data consistency and relationships

## 📈 Performance & Limits

### API Limits
- **Rate Limiting**: 1000 requests per minute per IP
- **Maximum Results**: 1000 per request (use pagination for more)
- **Timeout**: 30 seconds per request
- **Concurrent Requests**: 50 simultaneous connections

### Performance Metrics
- **Average Response Time**: <100ms
- **99th Percentile**: <500ms
- **Large City Divisions**: <200ms (e.g., Kyiv with 434 divisions)
- **Regional Statistics**: <50ms
- **Geospatial Search**: <150ms within 50km radius

### Database Statistics
- **Total Divisions**: 259,123
- **Total Cities**: 49,092
- **Parent Regions**: 575
- **Countries**: 22
- **Database Size**: ~500MB
- **Update Frequency**: Daily at 3:00 AM UTC

## 🌍 Regional Coverage

### Complete Coverage by Country
```
🇫🇷 France: 109 départements
🇱🇻 Latvia: 76 novadi/pilsētas
🇺🇸 United States: 51 states
🇷🇴 Romania: 42 județe
🇬🇧 United Kingdom: 26 regions
🇺🇦 Ukraine: 25 oblasts (24 + Kyiv)
🇮🇹 Italy: 20 regioni
🇵🇱 Poland: 16 województwa
🇨🇿 Czechia: 14 kraje
🇭🇺 Hungary: 13 megyék
🇳🇱 Netherlands: 12 provincies
🇧🇪 Belgium: 11 provinces
🇸🇰 Slovakia: 8 kraje
🇱🇹 Lithuania: 10 apskritys
🇪🇪 Estonia: 5 maakonnad
🇩🇰 Denmark: 5 regioner
🇲🇩 Moldova: 4 raioane  
🇱🇺 Luxembourg: 3 cantons
🇲🇹 Malta: 3 regions
🇸🇮 Slovenia: 2 regiji
🇭🇷 Croatia: 1 region
🇨🇾 Cyprus: 1 region
```

## 🔍 Search Capabilities

### Text Search
- **Division Names** - Search by postal division names
- **Addresses** - Search by street addresses
- **Cities** - Filter by city names
- **Regions** - Filter by administrative regions
- **Partial Matching** - Supports partial text matching

### Geospatial Search
- **Coordinate-based** - Find divisions near specific coordinates
- **Radius Search** - Configurable search radius (1-50km)
- **Distance Calculation** - Accurate distance measurements
- **Performance** - Optimized for large geographical datasets

### Filtering Options
- **Country** - Filter by country code
- **Region Type** - Filter by administrative division type
- **Status** - Filter by operational status
- **Weight Limits** - Filter by supported weight limits
- **Services** - Filter by available services

## 🎯 Use Cases

### 1. Logistics & Delivery Applications
```javascript
// Find optimal delivery points for region
const deliveryPoints = await client.findNearby(50.4501, 30.5234, 25);
const activePoints = deliveryPoints.data.filter(div => div.status === 'active');
console.log(`Found ${activePoints.length} active delivery points`);
```

### 2. Regional Analysis & Dashboards
```javascript
// Analyze postal coverage by oblasts
const ukraineRegions = await client.getRegions('UA');
for (const region of ukraineRegions.data) {
    const cities = await client.getCitiesInRegion(region.id);
    console.log(`${region.name}: ${cities.pagination.total} cities`);
}
```

### 3. Address Validation & Geocoding
```javascript
// Validate and find division for address
const results = await client.searchDivisions('Хрещатик, 22', 'UA');
if (results?.data.length) {
    const division = results.data[0];
    console.log(`Found: ${division.name} at ${division.coordinates.lat}, ${division.coordinates.lng}`);
}
```

### 4. Administrative Mapping
```javascript
// Build complete administrative hierarchy
const countries = await client.request('/divisions/countries');
for (const country of countries.data) {
    const regions = await client.getRegions(country.country_code);
    console.log(`${country.country_name}: ${regions?.data.length || 0} regions`);
}
```

### 5. Service Coverage Analysis
```javascript
// Analyze service coverage in radius
async function analyzeCoverage(lat, lng, radius) {
    const divisions = await client.findNearby(lat, lng, radius);
    const byStatus = divisions.data.reduce((acc, div) => {
        acc[div.status] = (acc[div.status] || 0) + 1;
        return acc;
    }, {});
    
    console.log(`Coverage within ${radius}km:`, byStatus);
    return byStatus;
}
```

## 🔗 Related Documentation

- **[Cities API Guide](CITIES_API.md)** - Detailed Cities API usage
- **[Changelog](CHANGELOG.md)** - Complete version history
- **[Release Notes](RELEASE_2.0.0.md)** - Version 2.0.0 details
- **[OpenAPI Specification](openapi.yaml)** - Complete API specification
- **[Interactive Docs](http://localhost:3001/docs)** - Swagger UI

## 📞 Support & Troubleshooting

### Common Issues

#### "Unknown Region" for some cities
This was fixed in version 2.0.0. If you still see this:
1. Run force update: `bun run src/cli/update.ts force-update`
2. Check if your database is up to date

#### Slow geospatial queries
1. Reduce search radius
2. Use `limit` parameter to cap results
3. Check if PostGIS indexes are created

#### API timeout errors
1. Increase request timeout in your client
2. Use pagination for large datasets
3. Consider using smaller result limits

### Health Checks
```bash
# Check API health
curl "http://localhost:3001/api/v1/system/health"

# Check database statistics
curl "http://localhost:3001/api/v1/system/stats"

# View recent updates
curl "http://localhost:3001/api/v1/system/updates"
```

### Debug Mode
```bash
# Start with debug logging
DEBUG=* bun run dev

# Check database connection
bun run src/cli/check-db.ts

# Test NovaPost API connection
bun run src/cli/test-api.ts
```

---

**Version**: 2.0.0  
**Last Updated**: June 5, 2025  
**License**: MIT  
**Documentation**: http://localhost:3001/docs