# NovaPost API Documentation

Welcome to the NovaPost Divisions API documentation! 🚀

## 📖 About the Project

NovaPost API is a high-performance REST API for working with NovaPost postal divisions database with geospatial search capabilities.

### Key Features
- 🌍 **Geospatial Search** - find nearby divisions by coordinates
- 🔍 **Country and City Search** - filter divisions by location
- 📊 **System Monitoring** - health checks and statistics
- 🔄 **Automatic Updates** - daily synchronization with NovaPost API
- 🛡️ **Security** - read-only endpoints, CLI-based management

## 🌐 Interactive Documentation

### Online (Live API)
- **Swagger UI**: http://localhost:3001/api/v1/docs/swagger
- **OpenAPI JSON**: http://localhost:3001/api/v1/docs/openapi.json  
- **OpenAPI YAML**: http://localhost:3001/api/v1/docs/openapi.yaml

### Static Documentation
- **HTML**: [docs/generated/index.html](generated/index.html)
- **Markdown**: [docs/generated/api-documentation.md](generated/api-documentation.md)

## 📋 Documentation Sections

| Document | Description |
|----------|-------------|
| [OpenAPI Spec](openapi.yaml) | Complete OpenAPI 3.0 specification |
| [API Guide](generated/api-documentation.md) | Detailed description of all endpoints |
| [Examples](EXAMPLES.md) | Practical API usage examples |
| [CLI Usage](CLI.md) | Command line interface guide |
| [Security](SECURITY.md) | Security and best practices |

## 🚀 Quick Start

### 1. Check API Status
```bash
curl http://localhost:3001/api/v1/system/health
```

### 2. Find Nearby Divisions
```bash
curl "http://localhost:3001/api/v1/divisions/nearby?lat=50.4501&lng=30.5234&limit=5"
```

### 3. List Countries
```bash
curl http://localhost:3001/api/v1/divisions/countries
```

## 📊 Main Endpoints

### Divisions
- `GET /api/v1/divisions/nearby` - Find nearby divisions by coordinates
- `GET /api/v1/divisions/search` - Search divisions by filters
- `GET /api/v1/divisions/{id}` - Get division by ID
- `GET /api/v1/divisions/countries` - List all countries
- `GET /api/v1/divisions/countries/{code}/cities` - Cities by country

### System
- `GET /api/v1/system/health` - System health check
- `GET /api/v1/system/status` - System and database status
- `GET /api/v1/system/update-status` - Update information
- `GET /api/v1/system/updates/history` - Updates history

## 🔧 Documentation Generation

### Regenerate Documentation
```bash
# Generate static documentation
bun run docs:generate

# Start local server for viewing
bun run docs:serve
```

### Update OpenAPI Specification
1. Edit `docs/openapi.yaml`
2. Run `bun run docs:generate`
3. Check changes in browser

## 📝 Response Formats

All API endpoints return data in JSON format:

```json
{
  "success": true,
  "data": {...},
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15
  }
}
```

## 🛡️ Security

- All endpoints are read-only (GET methods only)
- Updates available only via CLI with SSH access
- Automatic data updates via cron jobs
- Details: [SECURITY.md](SECURITY.md)

## 🔄 Data Updates

- **Automatically**: Daily at 03:00 UTC
- **Manually**: Via CLI commands (requires SSH access)
- **Monitoring**: `/api/v1/system/update-status`

## 📈 Performance

- Database: PostGIS with spatial indexes
- Pagination: Up to 100 records per request
- Caching: Optimized SQL queries
- Limits: Rate limiting and timeout protection

## 🤝 Support

If you have questions or suggestions:
- 📧 Email: your-email@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/nova-post-api/issues)
- 📖 Wiki: [Project Wiki](https://github.com/yourusername/nova-post-api/wiki)

---

**API Version**: 1.1.0  
**Last Documentation Update**: $(date)  
**Status**: Production Ready ✅ 