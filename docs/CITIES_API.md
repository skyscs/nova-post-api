# Cities API Documentation

**Version**: 2.0.0  
**Endpoint**: `GET /api/v1/cities/{id}/divisions`

## 🎯 Overview

The Cities API provides complete access to all postal divisions within a specific city. This endpoint returns detailed information about each postal division including coordinates, schedules, addresses, phone numbers, and operational status.

### Key Features
- **Complete City Coverage** - All postal divisions for any city
- **Detailed Information** - Coordinates, schedules, phone numbers, addresses
- **Efficient Pagination** - Handle cities with hundreds of divisions
- **Regional Context** - City linked to parent region and country
- **Real-time Data** - Always up-to-date with NovaPost API

## 🚀 Quick Start

### Basic Usage
```bash
# Get all divisions in Kyiv (ID: 420)
curl "http://localhost:3001/api/v1/cities/420/divisions"

# With pagination
curl "http://localhost:3001/api/v1/cities/420/divisions?limit=10&offset=0"

# Specific city divisions count
curl "http://localhost:3001/api/v1/cities/420/divisions" | jq '.pagination.total'
```

## 📖 API Reference

### Endpoint
```http
GET /api/v1/cities/{id}/divisions
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `id` | integer | ✅ Yes | - | City ID (from cities table) |
| `limit` | integer | ❌ No | 50 | Maximum results per request (1-1000) |
| `offset` | integer | ❌ No | 0 | Number of results to skip |

### Response Format

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

## 🏙️ Supported Cities

### Major Cities with Most Divisions

| City | ID | Country | Divisions | Region |
|------|----|---------|-----------|---------| 
| Київ (Kyiv) | 420 | UA | 434 | м. Київ |
| Львів (Lviv) | 292 | UA | 76 | Львівська область |
| Одеса (Odesa) | 274 | UA | 71 | Одеська область |
| Харків (Kharkiv) | 464 | UA | 68 | Харківська область |
| Дніпро (Dnipro) | 49 | UA | 64 | Дніпропетровська область |

### How to Find City IDs

```bash
# Search cities by name
curl "http://localhost:3001/api/v1/divisions/search?query=Львів&country=UA" | jq '.data[0].city.id'

# Get cities in region
curl "http://localhost:3001/api/v1/parent-regions/23/cities" | jq '.data[] | {id, name}'
```

## 💻 Code Examples

### JavaScript/Node.js

#### Basic Usage
```javascript
async function getCityDivisions(cityId, limit = 50) {
    const response = await fetch(
        `http://localhost:3001/api/v1/cities/${cityId}/divisions?limit=${limit}`
    );
    const data = await response.json();
    
    if (data.success) {
        console.log(`City has ${data.pagination.total} postal divisions`);
        console.log(`Showing ${data.data.length} divisions`);
        return data;
    }
    
    throw new Error('Failed to fetch city divisions');
}

// Example usage
const kyivDivisions = await getCityDivisions(420, 10);
console.log(kyivDivisions.data[0]); // First division details
```

#### Complete City Information
```javascript
class CityPostalService {
    constructor(baseUrl = 'http://localhost:3001/api/v1') {
        this.baseUrl = baseUrl;
    }
    
    async getAllDivisions(cityId) {
        const allDivisions = [];
        let offset = 0;
        const limit = 100;
        
        while (true) {
            const response = await fetch(
                `${this.baseUrl}/cities/${cityId}/divisions?limit=${limit}&offset=${offset}`
            );
            const data = await response.json();
            
            if (!data.success || !data.data.length) break;
            
            allDivisions.push(...data.data);
            
            if (!data.pagination.hasMore) break;
            offset += limit;
        }
        
        return allDivisions;
    }
    
    async getCityInfo(cityId) {
        const firstPage = await fetch(`${this.baseUrl}/cities/${cityId}/divisions?limit=1`);
        const data = await firstPage.json();
        
        if (data.success && data.data.length > 0) {
            return {
                city: data.data[0].city,
                totalDivisions: data.pagination.total,
                region: data.data[0].city.parent_region
            };
        }
        
        return null;
    }
    
    analyzeCity(divisions) {
        const analysis = {
            total: divisions.length,
            activeCount: 0,
            withPhone: 0,
            withCoordinates: 0,
            weightLimits: {},
            coverageArea: {
                minLat: 90,
                maxLat: -90,
                minLng: 180,
                maxLng: -180
            }
        };
        
        divisions.forEach(division => {
            if (division.status === 'active') analysis.activeCount++;
            if (division.phone) analysis.withPhone++;
            if (division.coordinates) {
                analysis.withCoordinates++;
                
                const { lat, lng } = division.coordinates;
                analysis.coverageArea.minLat = Math.min(analysis.coverageArea.minLat, lat);
                analysis.coverageArea.maxLat = Math.max(analysis.coverageArea.maxLat, lat);
                analysis.coverageArea.minLng = Math.min(analysis.coverageArea.minLng, lng);
                analysis.coverageArea.maxLng = Math.max(analysis.coverageArea.maxLng, lng);
            }
            
            if (division.weight_limit) {
                const limit = division.weight_limit;
                analysis.weightLimits[limit] = (analysis.weightLimits[limit] || 0) + 1;
            }
        });
        
        return analysis;
    }
}

// Usage example
const service = new CityPostalService();

// Get complete information about Kyiv
const kyivInfo = await service.getCityInfo(420);
console.log(kyivInfo);

// Get all divisions in Kyiv
const allKyivDivisions = await service.getAllDivisions(420);
console.log(`Total divisions: ${allKyivDivisions.length}`);

// Analyze postal coverage
const analysis = service.analyzeCity(allKyivDivisions);
console.log('City analysis:', analysis);
```

#### Division Filtering and Search
```javascript
async function findDivisionsInCity(cityId, filters = {}) {
    const allDivisions = await service.getAllDivisions(cityId);
    
    return allDivisions.filter(division => {
        // Filter by status
        if (filters.status && division.status !== filters.status) {
            return false;
        }
        
        // Filter by weight limit
        if (filters.minWeight && division.weight_limit < filters.minWeight) {
            return false;
        }
        
        // Filter by text in name or address
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const inName = division.name.toLowerCase().includes(searchLower);
            const inAddress = division.address.toLowerCase().includes(searchLower);
            if (!inName && !inAddress) return false;
        }
        
        // Filter by area (bounding box)
        if (filters.bounds && division.coordinates) {
            const { lat, lng } = division.coordinates;
            const { north, south, east, west } = filters.bounds;
            if (lat > north || lat < south || lng > east || lng < west) {
                return false;
            }
        }
        
        return true;
    });
}

// Usage examples
// Find active divisions with high weight limit
const heavyDutyDivisions = await findDivisionsInCity(420, {
    status: 'active',
    minWeight: 50
});

// Find divisions in city center
const centerDivisions = await findDivisionsInCity(420, {
    bounds: {
        north: 50.46,
        south: 50.44,
        east: 30.54,
        west: 30.50
    }
});

// Search for specific street
const khreshchatykDivisions = await findDivisionsInCity(420, {
    search: 'Хрещатик'
});
```

### Python

#### Basic Client
```python
import requests
from typing import List, Dict, Optional, Any
import math

class CityPostalClient:
    def __init__(self, base_url: str = "http://localhost:3001/api/v1"):
        self.base_url = base_url
    
    def get_city_divisions(self, city_id: int, limit: int = 50, offset: int = 0) -> Optional[Dict[str, Any]]:
        """Get divisions for a specific city"""
        url = f"{self.base_url}/cities/{city_id}/divisions"
        params = {"limit": limit, "offset": offset}
        
        response = requests.get(url, params=params)
        data = response.json()
        
        return data if data.get('success') else None
    
    def get_all_city_divisions(self, city_id: int) -> List[Dict[str, Any]]:
        """Get all divisions for a city (handles pagination)"""
        all_divisions = []
        offset = 0
        limit = 100
        
        while True:
            result = self.get_city_divisions(city_id, limit, offset)
            if not result or not result['data']:
                break
            
            all_divisions.extend(result['data'])
            
            if not result['pagination'].get('hasMore', False):
                break
                
            offset += limit
        
        return all_divisions
    
    def analyze_city_coverage(self, city_id: int) -> Dict[str, Any]:
        """Analyze postal coverage for a city"""
        divisions = self.get_all_city_divisions(city_id)
        
        if not divisions:
            return {"error": "No divisions found"}
        
        analysis = {
            "total_divisions": len(divisions),
            "active_divisions": sum(1 for d in divisions if d.get('status') == 'active'),
            "with_coordinates": sum(1 for d in divisions if d.get('coordinates')),
            "with_phone": sum(1 for d in divisions if d.get('phone')),
            "weight_limits": {},
            "coverage_area": None,
            "city_info": divisions[0]['city'] if divisions else None
        }
        
        # Analyze weight limits
        for division in divisions:
            if division.get('weight_limit'):
                limit = division['weight_limit']
                analysis['weight_limits'][limit] = analysis['weight_limits'].get(limit, 0) + 1
        
        # Calculate coverage area
        coords = [d['coordinates'] for d in divisions if d.get('coordinates')]
        if coords:
            lats = [c['lat'] for c in coords]
            lngs = [c['lng'] for c in coords]
            analysis['coverage_area'] = {
                "center": {
                    "lat": sum(lats) / len(lats),
                    "lng": sum(lngs) / len(lngs)
                },
                "bounds": {
                    "north": max(lats),
                    "south": min(lats),
                    "east": max(lngs),
                    "west": min(lngs)
                }
            }
        
        return analysis
    
    def find_nearest_divisions(self, city_id: int, target_lat: float, target_lng: float, count: int = 5) -> List[Dict[str, Any]]:
        """Find nearest divisions to specific coordinates within city"""
        divisions = self.get_all_city_divisions(city_id)
        
        def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
            """Calculate distance between two points using Haversine formula"""
            R = 6371  # Earth's radius in kilometers
            
            lat1_rad = math.radians(lat1)
            lat2_rad = math.radians(lat2)
            delta_lat = math.radians(lat2 - lat1)
            delta_lng = math.radians(lng2 - lng1)
            
            a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng/2)**2
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
            
            return R * c
        
        # Calculate distances and sort
        divisions_with_distance = []
        for division in divisions:
            if division.get('coordinates'):
                coords = division['coordinates']
                distance = calculate_distance(target_lat, target_lng, coords['lat'], coords['lng'])
                division_copy = division.copy()
                division_copy['distance_km'] = round(distance, 2)
                divisions_with_distance.append(division_copy)
        
        # Sort by distance and return top results
        divisions_with_distance.sort(key=lambda x: x['distance_km'])
        return divisions_with_distance[:count]

# Usage examples
client = CityPostalClient()

# Basic usage
kyiv_divisions = client.get_city_divisions(420, limit=10)
print(f"Kyiv has {kyiv_divisions['pagination']['total']} divisions")

# Complete analysis
analysis = client.analyze_city_coverage(420)
print(f"Analysis for {analysis['city_info']['name']}:")
print(f"- Total divisions: {analysis['total_divisions']}")
print(f"- Active: {analysis['active_divisions']}")
print(f"- With coordinates: {analysis['with_coordinates']}")
print(f"- Weight limits: {analysis['weight_limits']}")

# Find nearest to city center
nearest = client.find_nearest_divisions(420, 50.4501, 30.5234, 5)
for i, division in enumerate(nearest, 1):
    print(f"{i}. {division['name']} - {division['distance_km']}km away")
```

### cURL Examples

#### Basic Operations
```bash
# Get first 10 divisions in Kyiv
curl -X GET "http://localhost:3001/api/v1/cities/420/divisions?limit=10" \
     | jq '.data[] | {name: .name, address: .address, phone: .phone}'

# Get division count for city
curl -X GET "http://localhost:3001/api/v1/cities/420/divisions?limit=1" \
     | jq '.pagination.total'

# Get city information
curl -X GET "http://localhost:3001/api/v1/cities/420/divisions?limit=1" \
     | jq '.data[0].city'

# Check if city has more than 100 divisions
curl -X GET "http://localhost:3001/api/v1/cities/420/divisions?limit=1" \
     | jq '.pagination.total > 100'
```

#### Advanced Queries
```bash
# Get all active divisions (using jq filter)
curl -X GET "http://localhost:3001/api/v1/cities/420/divisions?limit=100" \
     | jq '.data[] | select(.status == "active")'

# Find divisions with specific weight limit
curl -X GET "http://localhost:3001/api/v1/cities/420/divisions?limit=100" \
     | jq '.data[] | select(.weight_limit >= 50)'

# Get coordinate bounds for city
curl -X GET "http://localhost:3001/api/v1/cities/420/divisions?limit=1000" \
     | jq '[.data[].coordinates] | {
         min_lat: min_by(.lat).lat,
         max_lat: max_by(.lat).lat,
         min_lng: min_by(.lng).lng,
         max_lng: max_by(.lng).lng
       }'

# Count divisions by status
curl -X GET "http://localhost:3001/api/v1/cities/420/divisions?limit=1000" \
     | jq '.data | group_by(.status) | map({status: .[0].status, count: length})'
```

## 🗺️ Geographic Analysis

### City Coverage Analysis
```javascript
async function analyzeCityCoverage(cityId) {
    const service = new CityPostalService();
    const divisions = await service.getAllDivisions(cityId);
    const analysis = service.analyzeCity(divisions);
    
    // Calculate coverage density
    const area = calculateArea(analysis.coverageArea);
    const density = analysis.total / area;
    
    console.log(`City Coverage Analysis:`);
    console.log(`- Total divisions: ${analysis.total}`);
    console.log(`- Active divisions: ${analysis.activeCount} (${(analysis.activeCount/analysis.total*100).toFixed(1)}%)`);
    console.log(`- Coverage area: ${area.toFixed(2)} km²`);
    console.log(`- Division density: ${density.toFixed(2)} divisions/km²`);
    console.log(`- Available weight limits: ${Object.keys(analysis.weightLimits).join(', ')} kg`);
    
    return analysis;
}

function calculateArea(bounds) {
    // Simple rectangular area calculation
    const latDiff = bounds.maxLat - bounds.minLat;
    const lngDiff = bounds.maxLng - bounds.minLng;
    
    // Convert to approximate km (very rough calculation)
    const latKm = latDiff * 111; // 1 degree ≈ 111 km
    const lngKm = lngDiff * 111 * Math.cos(bounds.minLat * Math.PI / 180);
    
    return latKm * lngKm;
}
```

### Distance-based Analysis
```javascript
async function findOptimalDivisions(cityId, targetLat, targetLng, maxDistance = 5) {
    const service = new CityPostalService();
    const divisions = await service.getAllDivisions(cityId);
    
    const optimal = divisions.filter(division => {
        if (!division.coordinates || division.status !== 'active') return false;
        
        const distance = calculateDistance(
            targetLat, targetLng,
            division.coordinates.lat, division.coordinates.lng
        );
        
        return distance <= maxDistance;
    });
    
    // Sort by distance
    optimal.forEach(division => {
        division.distance = calculateDistance(
            targetLat, targetLng,
            division.coordinates.lat, division.coordinates.lng
        );
    });
    
    return optimal.sort((a, b) => a.distance - b.distance);
}

function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}
```

## 📊 Data Analysis Use Cases

### 1. Service Coverage Mapping
```javascript
// Create heatmap data for postal coverage
async function createCoverageHeatmap(cityId) {
    const divisions = await service.getAllDivisions(cityId);
    
    return divisions
        .filter(d => d.coordinates && d.status === 'active')
        .map(d => ({
            lat: d.coordinates.lat,
            lng: d.coordinates.lng,
            weight: d.weight_limit || 30, // Use weight limit as intensity
            name: d.name,
            address: d.address
        }));
}
```

### 2. Service Gap Analysis
```javascript
// Find areas with low postal coverage
async function findServiceGaps(cityId, gridSize = 0.01) {
    const divisions = await service.getAllDivisions(cityId);
    const activeDivisions = divisions.filter(d => d.coordinates && d.status === 'active');
    
    if (!activeDivisions.length) return [];
    
    // Create grid
    const bounds = service.analyzeCity(divisions).coverageArea;
    const grid = [];
    
    for (let lat = bounds.minLat; lat <= bounds.maxLat; lat += gridSize) {
        for (let lng = bounds.minLng; lng <= bounds.maxLng; lng += gridSize) {
            // Find nearest division
            const nearest = activeDivisions.reduce((prev, curr) => {
                const prevDist = calculateDistance(lat, lng, prev.coordinates.lat, prev.coordinates.lng);
                const currDist = calculateDistance(lat, lng, curr.coordinates.lat, curr.coordinates.lng);
                return currDist < prevDist ? curr : prev;
            });
            
            const distance = calculateDistance(lat, lng, nearest.coordinates.lat, nearest.coordinates.lng);
            
            // Areas with >2km to nearest division are potential gaps
            if (distance > 2) {
                grid.push({
                    lat,
                    lng,
                    nearestDistance: distance,
                    nearestDivision: nearest.name
                });
            }
        }
    }
    
    return grid.sort((a, b) => b.nearestDistance - a.nearestDistance);
}
```

### 3. Logistics Optimization
```javascript
// Group divisions by districts for route optimization
async function createDeliveryDistricts(cityId, maxDivisionsPerDistrict = 20) {
    const divisions = await service.getAllDivisions(cityId);
    const activeDivisions = divisions.filter(d => d.coordinates && d.status === 'active');
    
    // Simple clustering by proximity
    const districts = [];
    const used = new Set();
    
    for (const division of activeDivisions) {
        if (used.has(division.id)) continue;
        
        const district = [division];
        used.add(division.id);
        
        // Find nearby divisions for same district
        for (const other of activeDivisions) {
            if (used.has(other.id) || district.length >= maxDivisionsPerDistrict) continue;
            
            const distance = calculateDistance(
                division.coordinates.lat, division.coordinates.lng,
                other.coordinates.lat, other.coordinates.lng
            );
            
            if (distance <= 3) { // Within 3km
                district.push(other);
                used.add(other.id);
            }
        }
        
        districts.push({
            id: districts.length + 1,
            center: {
                lat: district.reduce((sum, d) => sum + d.coordinates.lat, 0) / district.length,
                lng: district.reduce((sum, d) => sum + d.coordinates.lng, 0) / district.length
            },
            divisions: district,
            totalWeightCapacity: district.reduce((sum, d) => sum + (d.weight_limit || 30), 0)
        });
    }
    
    return districts;
}
```

## 🔧 Performance Optimization

### Caching Strategies
```javascript
class CachedCityService extends CityPostalService {
    constructor(baseUrl, cacheTimeout = 3600000) { // 1 hour cache
        super(baseUrl);
        this.cache = new Map();
        this.cacheTimeout = cacheTimeout;
    }
    
    async getCityDivisions(cityId, limit = 50, offset = 0) {
        const cacheKey = `${cityId}-${limit}-${offset}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        
        const result = await super.getCityDivisions(cityId, limit, offset);
        
        if (result) {
            this.cache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });
        }
        
        return result;
    }
    
    clearCache() {
        this.cache.clear();
    }
}
```

### Pagination Best Practices
```javascript
// Efficient pagination for large cities
async function efficientPagination(cityId, processor) {
    const batchSize = 100;
    let offset = 0;
    let processedCount = 0;
    
    while (true) {
        const result = await service.getCityDivisions(cityId, batchSize, offset);
        
        if (!result || !result.data.length) break;
        
        // Process batch
        await processor(result.data);
        processedCount += result.data.length;
        
        console.log(`Processed ${processedCount}/${result.pagination.total} divisions`);
        
        if (!result.pagination.hasMore) break;
        offset += batchSize;
        
        // Small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return processedCount;
}

// Usage
await efficientPagination(420, async (batch) => {
    // Process each batch of divisions
    batch.forEach(division => {
        console.log(`Processing: ${division.name}`);
        // Your processing logic here
    });
});
```

## 🎯 Integration Examples

### React Component
```jsx
import React, { useState, useEffect } from 'react';

const CityDivisionsMap = ({ cityId }) => {
    const [divisions, setDivisions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState(null);
    
    useEffect(() => {
        loadDivisions();
    }, [cityId]);
    
    const loadDivisions = async (offset = 0) => {
        setLoading(true);
        try {
            const response = await fetch(
                `/api/v1/cities/${cityId}/divisions?limit=50&offset=${offset}`
            );
            const data = await response.json();
            
            if (data.success) {
                if (offset === 0) {
                    setDivisions(data.data);
                } else {
                    setDivisions(prev => [...prev, ...data.data]);
                }
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error('Error loading divisions:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const loadMore = () => {
        if (pagination?.hasMore) {
            loadDivisions(pagination.offset + pagination.limit);
        }
    };
    
    return (
        <div className="city-divisions">
            <h2>Postal Divisions {pagination && `(${pagination.total} total)`}</h2>
            
            <div className="divisions-grid">
                {divisions.map(division => (
                    <div key={division.id} className="division-card">
                        <h3>{division.name}</h3>
                        <p>{division.address}</p>
                        {division.phone && <p>📞 {division.phone}</p>}
                        {division.schedule && <p>🕒 {division.schedule}</p>}
                        <p>Status: <span className={`status ${division.status}`}>
                            {division.status}
                        </span></p>
                    </div>
                ))}
            </div>
            
            {pagination?.hasMore && (
                <button onClick={loadMore} disabled={loading}>
                    {loading ? 'Loading...' : 'Load More'}
                </button>
            )}
        </div>
    );
};

export default CityDivisionsMap;
```

### Vue.js Component
```vue
<template>
  <div class="city-postal-browser">
    <h2>{{ cityInfo?.name }} Postal Services</h2>
    <div v-if="cityInfo?.parent_region" class="city-context">
      📍 {{ cityInfo.parent_region.name }}, {{ cityInfo.parent_region.country_code }}
    </div>
    
    <div class="statistics">
      <div class="stat">
        <strong>{{ pagination?.total || 0 }}</strong>
        <span>Total Divisions</span>
      </div>
      <div class="stat">
        <strong>{{ activeCount }}</strong>
        <span>Active</span>
      </div>
    </div>
    
    <div class="filters">
      <select v-model="statusFilter" @change="applyFilters">
        <option value="">All Statuses</option>
        <option value="active">Active Only</option>
        <option value="inactive">Inactive Only</option>
      </select>
      
      <input 
        v-model="searchQuery" 
        @input="applyFilters"
        placeholder="Search by name or address..."
      />
    </div>
    
    <div class="divisions-list">
      <div 
        v-for="division in filteredDivisions" 
        :key="division.id"
        class="division-item"
      >
        <h4>{{ division.name }}</h4>
        <p>{{ division.address }}</p>
        <div class="division-details">
          <span v-if="division.phone">📞 {{ division.phone }}</span>
          <span v-if="division.weight_limit">📦 Up to {{ division.weight_limit }}kg</span>
          <span :class="`status ${division.status}`">{{ division.status }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CityPostalBrowser',
  props: {
    cityId: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      divisions: [],
      pagination: null,
      cityInfo: null,
      statusFilter: '',
      searchQuery: '',
      loading: false
    };
  },
  computed: {
    filteredDivisions() {
      return this.divisions.filter(division => {
        const matchesStatus = !this.statusFilter || division.status === this.statusFilter;
        const matchesSearch = !this.searchQuery || 
          division.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          division.address.toLowerCase().includes(this.searchQuery.toLowerCase());
        
        return matchesStatus && matchesSearch;
      });
    },
    activeCount() {
      return this.divisions.filter(d => d.status === 'active').length;
    }
  },
  async mounted() {
    await this.loadDivisions();
  },
  methods: {
    async loadDivisions() {
      this.loading = true;
      try {
        const response = await fetch(
          `/api/v1/cities/${this.cityId}/divisions?limit=1000`
        );
        const data = await response.json();
        
        if (data.success) {
          this.divisions = data.data;
          this.pagination = data.pagination;
          if (data.data.length > 0) {
            this.cityInfo = data.data[0].city;
          }
        }
      } catch (error) {
        console.error('Error loading divisions:', error);
      } finally {
        this.loading = false;
      }
    },
    applyFilters() {
      // Filters are applied via computed property
      // This method exists for UI event handling
    }
  }
};
</script>
```

## 🔍 Error Handling

### Common Error Responses

#### City Not Found
```json
{
  "success": false,
  "error": "City not found",
  "code": "CITY_NOT_FOUND",
  "message": "No city found with ID: 999999"
}
```

#### Invalid Parameters
```json
{
  "success": false,
  "error": "Invalid parameters",
  "code": "INVALID_PARAMS",
  "details": {
    "limit": "Must be between 1 and 1000",
    "offset": "Must be non-negative"
  }
}
```

#### No Divisions Found
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "total": 0,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

### Error Handling Best Practices
```javascript
async function safeCityDivisions(cityId, options = {}) {
    try {
        const response = await fetch(
            `http://localhost:3001/api/v1/cities/${cityId}/divisions`,
            {
                timeout: 10000, // 10 second timeout
                ...options
            }
        );
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'API request failed');
        }
        
        return data;
        
    } catch (error) {
        if (error.name === 'TimeoutError') {
            console.error('Request timeout - city might have many divisions');
            return { success: false, error: 'Request timeout' };
        }
        
        if (error.message.includes('CITY_NOT_FOUND')) {
            console.error(`City ${cityId} not found`);
            return { success: false, error: 'City not found' };
        }
        
        console.error('Unexpected error:', error);
        return { success: false, error: 'Unexpected error' };
    }
}
```

## 🎯 Summary

The Cities API provides comprehensive access to postal division data for any city in the NovaPost database. Key advantages:

✅ **Complete Coverage** - All divisions for any city  
✅ **Rich Data** - Coordinates, schedules, phone numbers, addresses  
✅ **Efficient Pagination** - Handle cities with hundreds of divisions  
✅ **Regional Context** - Cities linked to administrative regions  
✅ **High Performance** - Optimized for large datasets  
✅ **Easy Integration** - Simple REST API with comprehensive examples  

Perfect for logistics applications, postal service mapping, administrative analysis, and location-based services requiring complete postal infrastructure data.

---

**Next Steps**: Explore [Parent Regions API](README.md#🗺️-parent-regions-api) for hierarchical navigation or [Geospatial Search](README.md#🏢-divisions-api) for coordinate-based queries. 