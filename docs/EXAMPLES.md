# API Usage Examples

Practical examples of using the NovaPost Divisions API.

## 🚀 Quick Start

### API Health Check

```bash
# Basic health check
curl http://localhost:3001/api/v1/system/health

# Detailed system status
curl http://localhost:3001/api/v1/system/status | jq
```

**Expected response:**
```json
{
  "status": "OK",
  "database": {
    "divisions": 24055,
    "countries": 26,
    "cities": 58222
  },
  "timestamp": "2025-06-04T21:00:00.000Z"
}
```

## 🌍 Geospatial Search

### Find nearest divisions by coordinates

```bash
# Find 5 nearest divisions within 10 km from Kyiv center
curl "http://localhost:3001/api/v1/divisions/nearby?lat=50.4501&lng=30.5234&radius=10&limit=5" | jq
```

### Search with country filter

```bash
# Nearest divisions in Ukraine only
curl "http://localhost:3001/api/v1/divisions/nearby?lat=50.4501&lng=30.5234&country=UA&limit=10" | jq
```

### Search with city filter

```bash
# Nearest divisions in Kyiv
curl "http://localhost:3001/api/v1/divisions/nearby?lat=50.4501&lng=30.5234&city=Kyiv&limit=10" | jq
```

**Example response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 4401,
      "nova_id": 1,
      "name": "Division #1",
      "country_code": "UA",
      "address": "1 Khreschatyk Street",
      "latitude": 50.4501,
      "longitude": 30.5234,
      "distance": 0.5
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 25,
    "totalPages": 5
  }
}
```

## 🔍 Search and Filtering

### Search divisions by country

```bash
# All divisions in Ukraine (first 20)
curl "http://localhost:3001/api/v1/divisions/search?country=UA&limit=20" | jq

# Divisions in Poland
curl "http://localhost:3001/api/v1/divisions/search?country=PL&limit=10" | jq
```

### Search divisions by city

```bash
# Divisions in Kyiv
curl "http://localhost:3001/api/v1/divisions/search?city=Kyiv&limit=10" | jq

# Divisions in Lviv
curl "http://localhost:3001/api/v1/divisions/search?city=Lviv&limit=10" | jq
```

### Combined search

```bash
# Divisions in Kyiv, Ukraine
curl "http://localhost:3001/api/v1/divisions/search?country=UA&city=Kyiv&limit=10" | jq
```

### Pagination

```bash
# First page (divisions 1-10)
curl "http://localhost:3001/api/v1/divisions/search?country=UA&limit=10&offset=0" | jq

# Second page (divisions 11-20)
curl "http://localhost:3001/api/v1/divisions/search?country=UA&limit=10&offset=10" | jq

# Third page (divisions 21-30)
curl "http://localhost:3001/api/v1/divisions/search?country=UA&limit=10&offset=20" | jq
```

## 📍 Get Specific Division

### By division ID

```bash
# Get division with ID 4401
curl "http://localhost:3001/api/v1/divisions/4401" | jq
```

**Example response:**
```json
{
  "success": true,
  "data": {
    "id": 4401,
    "nova_id": 1,
    "name": "Division #1",
    "country_code": "UA",
    "city_id": 8,
    "address": "1 Khreschatyk Street",
    "latitude": 50.4501,
    "longitude": 30.5234,
    "customer_service_available": true,
    "payment_enabled_delivery": true,
    "payment_enabled_pickup": true,
    "work_schedule": {
      "monday": "09:00-18:00",
      "tuesday": "09:00-18:00"
    }
  }
}
```

## 🌎 Reference Information

### List all countries

```bash
# Get all countries with division count
curl "http://localhost:3001/api/v1/divisions/countries" | jq
```

**Example response:**
```json
{
  "success": true,
  "data": [
    {
      "code": "UA",
      "name": "Ukraine",
      "divisions_count": 15420
    },
    {
      "code": "PL", 
      "name": "Poland",
      "divisions_count": 8635
    }
  ]
}
```

### Cities by country

```bash
# Cities in Ukraine
curl "http://localhost:3001/api/v1/divisions/countries/UA/cities" | jq

# Cities in Poland
curl "http://localhost:3001/api/v1/divisions/countries/PL/cities" | jq
```

**Example response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 8,
      "name": "Kyiv",
      "country_code": "UA",
      "region_name": "Kyiv Oblast",
      "divisions_count": 245
    },
    {
      "id": 15,
      "name": "Lviv",
      "country_code": "UA", 
      "region_name": "Lviv Oblast",
      "divisions_count": 89
    }
  ]
}
```

## 📊 Monitoring and Statistics

### Last update status

```bash
# Information about last data update
curl "http://localhost:3001/api/v1/system/update-status" | jq
```

### Updates history

```bash
# Last 10 updates
curl "http://localhost:3001/api/v1/system/updates/history?limit=10" | jq

# Last 5 updates
curl "http://localhost:3001/api/v1/system/updates/history?limit=5" | jq
```

**Example response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 15,
      "status": "completed",
      "message": "Database updated successfully",
      "divisions_count": 24055,
      "started_at": "2025-06-04T03:00:00.000Z",
      "completed_at": "2025-06-04T03:05:23.000Z"
    }
  ]
}
```

## 🔧 Practical Scenarios

### Scenario 1: Mobile App - Find Nearest Division

```bash
# 1. Get user's current coordinates (e.g., from GPS)
LAT=50.4501
LNG=30.5234

# 2. Find nearest divisions within 5 km
curl "http://localhost:3001/api/v1/divisions/nearby?lat=${LAT}&lng=${LNG}&radius=5&limit=5" | jq '.data[] | {name, address, distance}'
```

### Scenario 2: Website - Select Division by City

```bash
# 1. Show list of countries
curl "http://localhost:3001/api/v1/divisions/countries" | jq '.data[] | {code, name, divisions_count}'

# 2. User selected Ukraine - show cities
curl "http://localhost:3001/api/v1/divisions/countries/UA/cities" | jq '.data[] | {name, divisions_count}'

# 3. User selected Kyiv - show divisions
curl "http://localhost:3001/api/v1/divisions/search?country=UA&city=Kyiv&limit=20" | jq '.data[] | {name, address}'
```

### Scenario 3: Map Integration

```bash
# Get divisions with coordinates for map display
curl "http://localhost:3001/api/v1/divisions/search?country=UA&city=Kyiv&limit=50" | \
  jq '.data[] | select(.latitude != null and .longitude != null) | {name, address, latitude, longitude}'
```

### Scenario 4: Analytics and Reports

```bash
# Statistics by countries
curl "http://localhost:3001/api/v1/divisions/countries" | \
  jq '.data | sort_by(.divisions_count) | reverse | .[] | "\(.name): \(.divisions_count) divisions"'

# API availability check
curl -w "Response time: %{time_total}s\n" -o /dev/null -s "http://localhost:3001/api/v1/system/health"
```

## 🛠 Error Handling

### Handle 404 errors

```bash
# Try to get non-existent division
curl "http://localhost:3001/api/v1/divisions/999999" | jq

# Expected response:
# {
#   "success": false,
#   "error": "Division not found"
# }
```

### Handle validation errors

```bash
# Invalid coordinates
curl "http://localhost:3001/api/v1/divisions/nearby?lat=invalid&lng=30.5234" | jq

# Invalid country code
curl "http://localhost:3001/api/v1/divisions/countries/INVALID/cities" | jq
```

## 📱 Examples for Different Programming Languages

### JavaScript/Node.js

```javascript
// Find nearby divisions
async function findNearbyDivisions(lat, lng, radius = 10) {
  const response = await fetch(
    `http://localhost:3001/api/v1/divisions/nearby?lat=${lat}&lng=${lng}&radius=${radius}&limit=10`
  );
  const data = await response.json();
  return data.success ? data.data : [];
}

// Usage
const divisions = await findNearbyDivisions(50.4501, 30.5234, 5);
console.log(divisions);
```

### Python

```python
import requests

def find_nearby_divisions(lat, lng, radius=10):
    url = f"http://localhost:3001/api/v1/divisions/nearby"
    params = {
        'lat': lat,
        'lng': lng,
        'radius': radius,
        'limit': 10
    }
    
    response = requests.get(url, params=params)
    data = response.json()
    
    return data['data'] if data['success'] else []

# Usage
divisions = find_nearby_divisions(50.4501, 30.5234, 5)
print(divisions)
```

### PHP

```php
<?php
function findNearbyDivisions($lat, $lng, $radius = 10) {
    $url = "http://localhost:3001/api/v1/divisions/nearby";
    $params = http_build_query([
        'lat' => $lat,
        'lng' => $lng,
        'radius' => $radius,
        'limit' => 10
    ]);
    
    $response = file_get_contents($url . '?' . $params);
    $data = json_decode($response, true);
    
    return $data['success'] ? $data['data'] : [];
}

// Usage
$divisions = findNearbyDivisions(50.4501, 30.5234, 5);
print_r($divisions);
?>
```

## 🔍 Optimization Tips

### Efficient pagination usage

```bash
# Get total count
TOTAL=$(curl -s "http://localhost:3001/api/v1/divisions/search?country=UA&limit=1" | jq '.pagination.total')
echo "Total divisions in Ukraine: $TOTAL"

# Get all records in chunks
LIMIT=100
for ((offset=0; offset<TOTAL; offset+=LIMIT)); do
  echo "Loading records $offset-$((offset+LIMIT-1))..."
  curl -s "http://localhost:3001/api/v1/divisions/search?country=UA&limit=$LIMIT&offset=$offset" | \
    jq '.data[] | {id, name, city}' >> ukraine_divisions.json
done
```

### Caching results

```bash
# Cache countries list (rarely updated)
curl "http://localhost:3001/api/v1/divisions/countries" > countries_cache.json

# Use cache
cat countries_cache.json | jq '.data[] | {code, name}'
```

---

💡 **Tip**: Use interactive Swagger UI documentation at http://localhost:3001/api/v1/docs/swagger to test the API in your browser! 