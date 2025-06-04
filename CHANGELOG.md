# Changelog

## [1.1.0] - 2025-06-04

### 🔒 Security Improvements

**BREAKING CHANGES**: Removed public database update endpoints for security reasons.

#### Removed Endpoints
- `POST /api/v1/system/update` - Manual database update trigger
- `POST /api/v1/system/load-data` - Load data from file  
- `POST /api/v1/system/update-from-api` - Update from NovaPost API

#### Security Risks Addressed
- **DoS Protection**: Prevents malicious users from triggering resource-intensive updates
- **Data Integrity**: Eliminates risk of concurrent update conflicts
- **Resource Management**: Protects server from unauthorized heavy operations
- **Access Control**: Ensures only authorized administrators can modify database

#### New Features
- **CLI Management**: Added comprehensive CLI tools for database management
  - `bun run cli:status` - System status
  - `bun run cli:check` - Check for updates
  - `bun run cli:update` - Perform updates
  - `bun run cli:history` - Update history
- **Enhanced Documentation**: Added security guidelines and best practices

#### Migration Guide
Replace public API calls with CLI commands:

**Before:**
```bash
curl -X POST "http://localhost:3001/api/v1/system/update"
```

**After (requires server access):**
```bash
bun run cli:update
```

#### Monitoring Endpoints (Still Available)
- `GET /api/v1/system/health` - Health check
- `GET /api/v1/system/status` - Database statistics  
- `GET /api/v1/system/update-status` - Last update info
- `GET /api/v1/system/updates/history` - Update history

### 📚 Documentation
- Added `docs/SECURITY.md` with security guidelines
- Updated README.md with CLI usage examples
- Enhanced API documentation

---

## [1.0.0] - 2025-06-03

### 🎉 Initial Release

- NovaPost divisions API with geospatial search
- PostgreSQL + PostGIS database
- Docker containerization
- GitHub Actions CI/CD
- Automatic daily updates from NovaPost API
- Comprehensive logging and monitoring 