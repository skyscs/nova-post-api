# NovaPost Divisions API

API for working with NovaPost postal divisions database with geospatial search capabilities.

## Features

- ✅ Geospatial search for nearby divisions
- ✅ Search by country and city
- ✅ Automatic daily database updates
- ✅ PostGIS for efficient spatial queries
- ✅ Docker deployment
- ✅ Comprehensive logging
- ✅ Health monitoring

## Tech Stack

- **Runtime**: Bun
- **Framework**: Hono
- **Database**: PostgreSQL with PostGIS
- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions

## Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nova-post-api
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Setup environment**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start services**
   ```bash
   docker-compose up -d postgres
   bun run dev
   ```

### Production Deployment

1. **Configure secrets in GitHub repository**
   - `HOST` - Server hostname/IP
   - `USERNAME` - SSH username
   - `SSH_KEY` - Private SSH key
   - `PORT` - SSH port (usually 22)
   - `DATABASE_URL` - PostgreSQL connection string
   - `APP_PORT` - Application port (default: 3001)
   - `NOVA_POST_API_URL` - NovaPost API endpoint
   - And other environment variables...

2. **Deploy via GitHub Actions**
   ```bash
   git push origin main
   ```

## API Endpoints

### Base URL
```
http://localhost:3001/api/v1
```

### Divisions

#### Get Nearby Divisions
```http
GET /divisions/nearby?lat=50.4501&lng=30.5234&radius=10&limit=20
```

**Parameters:**
- `lat` (optional) - Latitude
- `lng` (optional) - Longitude  
- `radius` (optional) - Search radius in kilometers
- `country` (optional) - Country filter
- `city` (optional) - City filter
- `limit` (optional) - Results limit (default: 50)
- `offset` (optional) - Results offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nova_id": "12345",
      "name": "Division Name",
      "country": "Ukraine", 
      "country_code": "UA",
      "city": "Kyiv",
      "address": "Street Address",
      "phone": "+380123456789",
      "email": "division@novapost.ua",
      "working_hours": "Mon-Fri 9:00-18:00",
      "latitude": 50.4501,
      "longitude": 30.5234,
      "distance": 5.2,
      "metadata": {},
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1500,
    "totalPages": 75
  }
}
```

#### Search Divisions
```http
GET /divisions/search?country=Ukraine&city=Kyiv&limit=10
```

#### Get Division by ID
```http
GET /divisions/{id}
```

#### Get All Countries
```http
GET /divisions/countries
```

#### Get Cities by Country
```http
GET /divisions/countries/{countryCode}/cities
```

#### Get Divisions by City
```http
GET /divisions/cities/{city}/{countryCode}/divisions
```

### System

#### Health Check
```http
GET /system/health
```

#### System Status
```http
GET /system/status
```

#### Manual Update
```http
POST /system/update
```

#### Update History
```http
GET /system/updates/history?limit=10
```

## Database Schema

### Tables

- **divisions** - Main divisions data with PostGIS geometry
- **countries** - Countries lookup table
- **cities** - Cities lookup table  
- **update_logs** - Update operation logs

### Indexes

- Spatial index on `location` column for fast geospatial queries
- B-tree indexes on `country`, `city`, and `nova_id` columns

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `PORT` | Application port | 3001 |
| `NODE_ENV` | Environment | development |
| `NOVA_POST_API_URL` | NovaPost API endpoint | - |
| `UPDATE_CRON` | Cron expression for updates | 0 2 * * * |
| `LOG_LEVEL` | Logging level | info |

## Development

### Scripts

```bash
# Development
bun run dev

# Build
bun run build

# Production
bun run start

# Database migration
bun run db:migrate

# Linting
bun run lint

# Formatting
bun run format
```

### Adding New Features

1. Create feature branch
2. Implement changes
3. Add tests
4. Update documentation
5. Create pull request

## Monitoring

### Logs

Application logs are stored in the `logs/` directory:
- `combined.log` - All logs
- `error.log` - Error logs only

### Health Checks

Monitor the API health at `/api/v1/system/health`

### Metrics

System status and database information at `/api/v1/system/status`

## Troubleshooting

### Common Issues

1. **Database connection failed**
   - Check DATABASE_URL
   - Ensure PostgreSQL is running
   - Verify PostGIS extension is installed

2. **Updates not working**
   - Check NOVA_POST_API_URL accessibility
   - Verify cron expression format
   - Check update logs via API

3. **Geospatial queries slow**
   - Ensure spatial index exists on location column
   - Check PostGIS configuration

### Support

For issues and questions, please check the logs and system status first. 