# NovaPost Divisions API

**Version:** 1.1.0

High-performance REST API for working with NovaPost postal divisions database with geospatial search capabilities.

## Key Features
- 🌍 **Geospatial Search** - find nearby divisions by coordinates
- 🔍 **Country and City Search** - filter divisions by location
- 📊 **System Monitoring** - health checks and statistics
- 🔄 **Automatic Updates** - daily synchronization with NovaPost API

## Security
- All endpoints are read-only (GET methods only)
- Update management available only via CLI with SSH access
- Comprehensive operation logging


**Support:** [NovaPost API Support](https://github.com/yourusername/nova-post-api)

## Servers

- **Local development server:** `http://localhost:3001/api/v1`
- **Production server:** `https://api.yourserver.com/api/v1`

## Divisions

### GET /divisions/nearby

**Find nearby divisions**

Find the nearest postal divisions by geographic coordinates.
Supports filtering by radius, country, and city.


#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `lat` | number | Yes | Latitude coordinate |
| `lng` | number | Yes | Longitude coordinate |
| `radius` | number | No | Search radius in kilometers |
| `country` | string | No | Country code (ISO 3166-1 alpha-2) |
| `city` | string | No | City name (partial match) |
| `limit` | integer | No | Maximum number of results |
| `offset` | integer | No | Offset for pagination |

#### Responses

**200** - List of nearby divisions

**400** - undefined

**500** - undefined

---

### GET /divisions/search

**Search divisions by filters**

Search postal divisions by various criteria without geographic coordinates

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `country` | string | No | Country code (ISO 3166-1 alpha-2) |
| `city` | string | No | City name |
| `limit` | integer | No | Maximum number of results |
| `offset` | integer | No | Offset for pagination |

#### Responses

**200** - List of divisions

---

### GET /divisions/{id}

**Get division by ID**

Get detailed information about a specific postal division

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `id` | integer | Yes | Unique division identifier |

#### Responses

**200** - Division information

**404** - undefined

---

### GET /divisions/countries

**List all countries**

Get list of all countries with division count for each

#### Responses

**200** - List of countries

---

### GET /divisions/countries/{countryCode}/cities

**Cities by country**

Get list of cities in specified country with division count

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `countryCode` | string | Yes | Country code (ISO 3166-1 alpha-2) |

#### Responses

**200** - List of cities

---

## System

### GET /system/health

**System health check**

Basic API health and availability check

#### Responses

**200** - System is healthy

**500** - undefined

---

### GET /system/status

**System status**

Detailed information about database and system state

#### Responses

**200** - System status

---

### GET /system/update-status

**Last update status**

Information about the last data update

#### Responses

**200** - Update status

---

### GET /system/updates/history

**Updates history**

List of recent system updates

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `limit` | integer | No | Number of records to return |

#### Responses

**200** - Updates history

---

## Data Schemas

### ApiResponse

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `success` | boolean | Request execution status |
| `data` | object | Response data |
| `error` | string | Error message (if success = false) |
| `pagination` | unknown |  |

### Pagination

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `page` | integer | Current page |
| `limit` | integer | Number of items per page |
| `total` | integer | Total number of items |
| `totalPages` | integer | Total number of pages |

### Division

Postal division

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | integer | Unique identifier |
| `nova_id` | integer | ID in NovaPost system |
| `name` | string | Division name |
| `short_name` | string | Short name |
| `external_id` | string | External identifier |
| `source` | string | Data source |
| `country_code` | string | Country code (ISO 3166-1 alpha-2) |
| `city_id` | integer | City ID |
| `address` | string | Division address |
| `display_address` | string | Display address |
| `number` | string | Division number |
| `status` | string | Division status |
| `customer_service_available` | boolean | Customer service availability |
| `division_category` | string | Division category |
| `payment_enabled_delivery` | boolean | Payment on delivery enabled |
| `payment_enabled_pickup` | boolean | Payment on pickup enabled |
| `responsible_person` | string | Responsible person |
| `latitude` | number | Latitude |
| `longitude` | number | Longitude |
| `long_term_location` | boolean | Long-term location |
| `max_weight_place_sender` | integer | Maximum weight for sender place (grams) |
| `max_length_place_sender` | integer | Maximum length for sender place (cm) |
| `max_width_place_sender` | integer | Maximum width for sender place (cm) |
| `max_height_place_sender` | integer | Maximum height for sender place (cm) |
| `max_weight_place_recipient` | integer | Maximum weight for recipient place (grams) |
| `max_length_place_recipient` | integer | Maximum length for recipient place (cm) |
| `max_width_place_recipient` | integer | Maximum width for recipient place (cm) |
| `max_height_place_recipient` | integer | Maximum height for recipient place (cm) |
| `prohibited_sending` | boolean | Sending prohibited |
| `prohibited_issuance` | boolean | Issuance prohibited |
| `max_cost_place` | number | Maximum place cost |
| `max_declared_cost_place` | number | Maximum declared place cost |
| `work_schedule` | object | Work schedule (JSON) |
| `full_address` | object | Full address (JSON) |
| `settings` | object | Division settings (JSON) |
| `additional_ids` | object | Additional identifiers (JSON) |
| `photos` | object | Photos (JSON) |
| `attributes` | object | Additional attributes (JSON) |
| `nova_created_at` | string | Creation date in NovaPost |
| `nova_updated_at` | string | Update date in NovaPost |
| `nova_deleted_at` | string | Deletion date in NovaPost |

### NearbyDivision

### Country

Country

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `code` | string | Country code (ISO 3166-1 alpha-2) |
| `name` | string | Country name |
| `divisions_count` | integer | Number of divisions in country |

### City

City

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | integer | Unique identifier |
| `nova_id` | integer | ID in NovaPost system |
| `name` | string | City name |
| `country_code` | string | Country code |
| `region_name` | string | Region name |
| `parent_region_name` | string | Parent region name |
| `divisions_count` | integer | Number of divisions in city |

### UpdateLog

Update log entry

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | integer | Unique identifier |
| `status` | string | Update status |
| `message` | string | Update message |
| `divisions_count` | integer | Number of processed divisions |
| `started_at` | string | Update start time |
| `completed_at` | string | Update completion time |
| `error_details` | string | Error details (JSON) |

