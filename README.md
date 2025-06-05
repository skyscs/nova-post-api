# NovaPost Divisions API

🚀 High-performance REST API for working with NovaPost postal divisions database with geospatial search support.

## ✨ Key Features

- 🌍 **Geospatial Search** - find nearest divisions by coordinates
- 🔍 **Country and City Search** - filter divisions 
- 🔄 **Automatic Updates** - daily synchronization with NovaPost API
- ⚡ **PostGIS** - efficient spatial queries
- 🐳 **Docker** - containerization for easy deployment
- 📊 **Monitoring** - logging and health checks
- 🔄 **CI/CD** - automatic deployment via GitHub Actions
- 📖 **OpenAPI Documentation** - interactive Swagger UI documentation

## 🛠 Technology Stack

- **Runtime**: [Bun](https://bun.sh/) - fast JavaScript/TypeScript runtime
- **Framework**: [Hono](https://hono.dev/) - lightweight web framework
- **Database**: PostgreSQL + PostGIS - spatial database
- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions

## 🚀 Quick Start

### Local Development

```bash
# Clone repository
git clone <repository-url>
cd nova-post-api

# Install dependencies
bun install

# Setup environment
cp env.example .env
# Edit .env file

# Start database
docker-compose up -d postgres

# Run in development mode
bun run dev
```

### Production Deployment

1. **Configure secrets in GitHub repository**
2. **Push to main branch** for automatic deployment

## 📖 API Documentation

### Interactive Documentation
- **🔥 Version 2.0.0**: Major update with regional system and Cities API
- **Swagger UI**: http://localhost:3001/api/v1/docs/swagger
- **OpenAPI JSON**: http://localhost:3001/api/v1/docs/openapi.json
- **OpenAPI YAML**: http://localhost:3001/api/v1/docs/openapi.yaml
- **Complete Documentation**: [docs/README.md](docs/README.md)

## 📡 API Endpoints

### Base URL: `/api/v1`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/divisions/nearby` | GET | Find nearby divisions |
| `/divisions/search` | GET | Search by filters |
| `/divisions/:id` | GET | Get division by ID |
| `/divisions/countries` | GET | List all countries |
| `/divisions/countries/:code/cities` | GET | Cities by country |
| `/parent-regions` | GET | List parent regions |
| `/parent-regions/stats` | GET | Regional statistics |
| `/parent-regions/:id/cities` | GET | Cities in region |
| `/cities/:id/divisions` | GET | **Divisions in city** |
| `/system/health` | GET | API health check |
| `/system/status` | GET | System status |
| `/system/update-status` | GET | Last update status |
| `/system/updates/history` | GET | Update history |

### Example Requests

```bash
# Find nearby divisions
curl "http://localhost:3001/api/v1/divisions/nearby?lat=50.4501&lng=30.5234&radius=10"

# Search by country
curl "http://localhost:3001/api/v1/divisions/search?country=Ukraine&limit=10"

# Get city divisions by ID
curl "http://localhost:3001/api/v1/cities/420/divisions?limit=10"

# Get country regions
curl "http://localhost:3001/api/v1/parent-regions?country=UA"

# Health check
curl "http://localhost:3001/api/v1/system/health"
```

## 📋 Architecture

```
src/
├── types/          # TypeScript types
├── utils/          # Utilities (database, logger)
├── services/       # Business logic
├── routes/         # API routes
└── index.ts        # Main application file

docker/
└── init.sql        # Database initialization SQL

docs/
└── README.md       # Detailed API documentation
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Application port | 3001 |
| `DATABASE_URL` | Database connection string | - |
| `NOVA_POST_API_URL` | NovaPost API URL | - |
| `UPDATE_CRON` | Cron expression for updates | `0 2 * * *` |
| `LOG_LEVEL` | Logging level | `info` |

### GitHub Secrets (for deployment)

- `HOST` - Server IP/hostname
- `USERNAME` - SSH user  
- `SSH_KEY` - Private SSH key
- `DATABASE_URL` - Database connection string
- `APP_PORT` - Application port
- Other environment variables...

## 📊 Monitoring

- **Logs**: `logs/combined.log`, `logs/error.log`
- **Health Check**: `GET /api/v1/system/health`
- **Status**: `GET /api/v1/system/status`
- **Update History**: `GET /api/v1/system/updates/history`

## 🔄 Automatic Updates

API automatically checks for NovaPost database updates every day at 3:00 UTC and updates local database when new version appears.

### 🔒 Update Security

For security **public update endpoints are removed**. Manual management available only via CLI with server access:

```bash
# Check status
bun run cli:status

# Check available updates  
bun run cli:check

# Perform update
bun run cli:update

# Show update history
bun run cli:history
```

More details in [security documentation](docs/SECURITY.md).

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Update documentation
6. Create Pull Request

## 📄 License

MIT License

## 📞 Support

- 📖 [Detailed Documentation](docs/README.md)
- 🐛 [Issues](../../issues)
- 💬 [Discussions](../../discussions)

---

Created with ❤️ for efficient work with NovaPost API 