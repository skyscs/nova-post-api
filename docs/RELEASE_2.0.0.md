# Release 2.0.0 - Regional Revolution 🌍

**Release Date**: June 5, 2025  
**Type**: Major Version Update  
**Compatibility**: Backward compatible (deprecated features marked)

## 🎯 What's New

**NovaPost API 2.0.0** brings complete regional data accuracy and introduces Cities API for hierarchical navigation from countries to specific postal divisions.

### 📊 Key Improvements

- **Region Data Accuracy**: From 16% to 99% (84% → 1% "Unknown Region")
- **API Endpoints**: From 4 to 13 endpoints (+225% increase)
- **Database Tables**: From 3 to 5 tables (+67% increase)  
- **Parent Regions**: 575 regions across 22 countries
- **Navigation**: Complete hierarchical Country → Region → City → Division

## 🔥 Major Features

### 1. 🗺️ Parent Regions System

**NEW**: Complete regional hierarchy with administrative divisions:

```bash
# Get all regions
GET /api/v1/parent-regions

# Filter by country  
GET /api/v1/parent-regions?country=UA

# Regional statistics
GET /api/v1/parent-regions/stats

# Cities in region
GET /api/v1/parent-regions/{id}/cities
```

**Coverage**: 575 regions including:
- **Ukraine**: 24 oblasts + Kyiv
- **France**: 109 départements  
- **United States**: 51 states
- **Poland**: 16 voivodeships
- **And 18 more countries**

### 2. 🏙️ Cities API

**NEW**: Complete city information with all postal divisions:

```bash
# All divisions in city
GET /api/v1/cities/420/divisions

# With pagination
GET /api/v1/cities/420/divisions?limit=50&offset=100

# Example response for Kyiv (id: 420)
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nova_id": 1,
      "name": "Відділення №1 (до 30 кг): вул. Хрещатик, 22",
      "address": "02000, м. Київ, вул. Хрещатик, 22",
      "coordinates": { "lat": 50.4501, "lng": 30.5234 },
      "phone": "+380442391111",
      "schedule": "Пн-Пт: 8:00-20:00, Сб: 9:00-18:00",
      "status": "active",
      "weight_limit": 30,
      "city": { "id": 420, "name": "Київ" }
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

### 3. 🔧 Force Update System

**NEW**: Complete database refresh capabilities:

```bash
# Full database refresh
bun run src/cli/update.ts force-update

# Refresh with limit
bun run src/cli/update.ts force-update-api 1000

# Clear all data
bun run src/cli/update.ts clear-all
```

**Safety**: All commands require confirmation for critical operations.

## 🐛 Critical Bug Fixes

### Regional Data Problem (SOLVED)

**The Issue**: 
```
Before: 49,080 out of 58,223 cities (84%) showed "Unknown Region"
After:  575 cities (1%) show "Unknown Region"
Improvement: 99% accuracy! 🎉
```

**Root Cause**: NovaPost API structure was misunderstood. Regional data was in `division.region` and `division.parent`, not `city.region`.

**Solution**: Completely rewrote region extraction logic with proper NovaPost API mapping.

**Examples of Fixed Regions**:
- **Ukraine**: "Київська область" instead of "Unknown Region"
- **France**: "Département du Nord" instead of "Unknown Region"  
- **Poland**: "Województwo mazowieckie" instead of "Unknown Region"

## 📖 Navigation Patterns

### 1. Hierarchical Navigation
```javascript
// 1. Choose country
const countries = await fetch('/api/v1/divisions/countries');

// 2. Get regions for country
const regions = await fetch('/api/v1/parent-regions?country=UA');

// 3. Get cities in region  
const cities = await fetch('/api/v1/parent-regions/23/cities');

// 4. Get divisions in city
const divisions = await fetch('/api/v1/cities/420/divisions');
```

### 2. Direct City Access
```javascript
// Directly access city divisions
const response = await fetch('/api/v1/cities/420/divisions?limit=10');
console.log(`Found ${response.pagination.total} divisions in Kyiv`);
```

### 3. Geospatial Search
```javascript
// Find nearby divisions
const nearby = await fetch('/api/v1/divisions/nearby?lat=50.4501&lng=30.5234&radius=5');
```

## 🚀 Complete API Overview

| Endpoint | Method | Description | New |
|----------|--------|-------------|-----|
| `/api/v1/divisions/nearby` | GET | Find nearby divisions | ✅ |
| `/api/v1/divisions/search` | GET | Search divisions | ✅ |
| `/api/v1/divisions/{id}` | GET | Get division by ID | ✅ |
| `/api/v1/divisions/countries` | GET | List all countries | ✅ |
| `/api/v1/parent-regions` | GET | List parent regions | 🆕 |
| `/api/v1/parent-regions/stats` | GET | Regional statistics | 🆕 |
| `/api/v1/parent-regions/{id}` | GET | Get region by ID | 🆕 |
| `/api/v1/parent-regions/{id}/cities` | GET | Cities in region | 🆕 |
| `/api/v1/cities/{id}/divisions` | GET | Divisions in city | 🆕 |
| `/api/v1/system/health` | GET | System health check | ✅ |
| `/api/v1/system/stats` | GET | Database statistics | ✅ |
| `/api/v1/system/updates` | GET | Update history | ✅ |
| `/api/v1/system/update` | POST | Trigger update | ✅ |

## 📊 Performance & Statistics

### Database Performance
```
Divisions: 259,123 (complete NovaPost database)
Cities: 49,092 (fully populated)
Parent Regions: 575 (22 countries)
Countries: 22 (full coverage)

Average Response Time: <100ms
Cache Hit Rate: 95%+
Database Size: ~500MB
Update Time: 15-20 minutes (full refresh)
```

### Regional Coverage
```
🇫🇷 France: 109 départements
🇱🇻 Latvia: 76 regions  
🇺🇸 United States: 51 states
🇷🇴 Romania: 42 counties
🇬🇧 United Kingdom: 26 regions
🇺🇦 Ukraine: 25 oblasts (24 + Kyiv)
🇮🇹 Italy: 20 regions
🇵🇱 Poland: 16 voivodeships
```

## 🔄 Migration Guide

### For Existing Applications

**No Breaking Changes!** All existing endpoints work exactly as before.

#### 1. Pagination Format (Recommended Update)
```javascript
// Old format (still works, but deprecated)
const { page, totalPages } = response.pagination;

// New format (recommended)
const { total, limit, offset, hasMore } = response.pagination;
```

#### 2. Regional Data (Automatic Improvement)
```javascript
// Before: 84% showed "Unknown Region"
// After: 99% show correct region names
// No code changes required - works automatically!
```

#### 3. New Endpoints (Optional)
```javascript
// New hierarchical navigation available
const cityDivisions = await fetch('/api/v1/cities/420/divisions');
const regionCities = await fetch('/api/v1/parent-regions/23/cities');
```

### Migration Steps
1. **No immediate action required** - all existing code works
2. **Update pagination** handling when convenient
3. **Explore new endpoints** for enhanced functionality
4. **Update documentation** references if needed

## 🛠️ Technical Improvements

### Database Schema
```sql
-- New parent_regions table
CREATE TABLE parent_regions (
    id SERIAL PRIMARY KEY,
    nova_id INTEGER UNIQUE,
    name VARCHAR(255) NOT NULL,
    country_code VARCHAR(2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Link cities to regions
ALTER TABLE cities ADD COLUMN parent_region_id INTEGER;
ALTER TABLE cities ADD CONSTRAINT fk_cities_parent_region 
    FOREIGN KEY (parent_region_id) REFERENCES parent_regions(id);
```

### Performance Indexes
```sql
CREATE INDEX idx_parent_regions_country_code ON parent_regions(country_code);
CREATE INDEX idx_parent_regions_name ON parent_regions(name);  
CREATE INDEX idx_cities_parent_region_id ON cities(parent_region_id);
```

## 🎯 Use Cases

### 1. Regional Dashboard
```javascript
// Show statistics by administrative regions
const stats = await fetch('/api/v1/parent-regions/stats');
const ukraineRegions = await fetch('/api/v1/parent-regions?country=UA');
```

### 2. City Postal Browser
```javascript
// Complete postal service for city
const cityDivisions = await fetch('/api/v1/cities/420/divisions');
// Display all 434 postal divisions in Kyiv with map
```

### 3. Logistics Route Planning
```javascript
// Plan delivery routes by cities
const regionCities = await fetch('/api/v1/parent-regions/23/cities');
// Get all cities in Kyiv Oblast for route optimization
```

### 4. Administrative Analysis
```javascript
// Analyze postal coverage by regions
const allRegions = await fetch('/api/v1/parent-regions');
for (const region of allRegions.data) {
    const cities = await fetch(`/api/v1/parent-regions/${region.id}/cities`);
    console.log(`${region.name}: ${cities.pagination.total} cities`);
}
```

### 5. Hierarchical Navigation
```javascript
// Complete navigation from country to division
const countries = await fetch('/api/v1/divisions/countries');
const regions = await fetch('/api/v1/parent-regions?country=UA');
const cities = await fetch('/api/v1/parent-regions/23/cities');
const divisions = await fetch('/api/v1/cities/420/divisions');
```

## 🔐 Security & Reliability

### Security Enhancements
- **Environment Variables**: No hardcoded API URLs
- **Parameter Validation**: All inputs validated
- **SQL Injection Protection**: Parameterized queries
- **CLI Confirmations**: Critical operations require confirmation

### Reliability Improvements
- **Error Handling**: Comprehensive error responses
- **Graceful Degradation**: API continues working if some services fail
- **Rollback Capability**: Previous data preserved during updates
- **Health Monitoring**: Complete system health endpoints

## 🧪 Testing

### All Features Tested
- ✅ 575 parent regions across 22 countries
- ✅ Hierarchical navigation Country → Region → City → Division
- ✅ Pagination with large datasets (434 divisions in Kyiv)
- ✅ Force update with complete database refresh
- ✅ Backward compatibility with existing applications
- ✅ Error handling and edge cases
- ✅ Performance with 259,123 divisions

### Test Examples
```bash
# Test regional data
curl "https://api.example.com/api/v1/parent-regions?country=UA"

# Test city divisions
curl "https://api.example.com/api/v1/cities/420/divisions?limit=5"

# Test statistics
curl "https://api.example.com/api/v1/parent-regions/stats"
```

## 📚 Documentation

### Updated Documentation
- **OpenAPI 3.0** specification with all endpoints
- **Interactive Swagger UI** at `/docs`
- **Complete API examples** in JavaScript, Python, cURL
- **Migration guides** for existing applications
- **Comprehensive README** with usage patterns

### Quick Start
```javascript
// Install dependencies
npm install

// Start API server
npm run dev

// Access documentation
open http://localhost:3000/docs
```

## 🎊 Conclusion

**NovaPost API 2.0.0** transforms postal data access with:
- **99% accurate regional data** (up from 16%)
- **Complete hierarchical navigation** 
- **Cities API** for detailed city information
- **575 regional divisions** across 22 countries
- **Backward compatibility** with zero breaking changes

**Ready to use immediately!** All existing applications continue working while gaining access to dramatically improved regional data and new navigation capabilities.

---

## 📞 Support

**Documentation**: Check `/docs` endpoint for interactive API documentation  
**Examples**: See `docs/README.md` for complete code examples  
**Migration**: See migration section above for upgrade guidance  
**Issues**: Report any issues with specific endpoints and request examples

**Version**: 2.0.0  
**Date**: June 5, 2025  
**Compatibility**: Full backward compatibility with 1.x versions 