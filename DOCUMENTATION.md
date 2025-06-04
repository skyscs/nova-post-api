# 📖 API Documentation

Quick access to NovaPost Divisions API documentation.

## 🌐 Interactive Documentation (Recommended)

**Swagger UI**: http://localhost:3001/api/v1/docs/swagger

> 💡 The best way to learn and test the API is through interactive documentation with the ability to execute requests directly in the browser.

## 📋 Complete Documentation

| Document | Description | Link |
|----------|-------------|------|
| 🏠 **Main** | Documentation overview | [docs/README.md](docs/README.md) |
| 🚀 **Examples** | Practical usage scenarios | [docs/EXAMPLES.md](docs/EXAMPLES.md) |
| 📊 **OpenAPI** | Complete API specification | [docs/openapi.yaml](docs/openapi.yaml) |
| 🔧 **CLI** | Command line interface guide | [docs/CLI.md](docs/CLI.md) |
| 🛡️ **Security** | Security recommendations | [docs/SECURITY.md](docs/SECURITY.md) |

## 🔗 API Endpoints

### Online Documentation
- **Swagger UI**: http://localhost:3001/api/v1/docs/swagger
- **OpenAPI JSON**: http://localhost:3001/api/v1/docs/openapi.json
- **OpenAPI YAML**: http://localhost:3001/api/v1/docs/openapi.yaml

### Static Documentation
- **HTML**: [docs/generated/index.html](docs/generated/index.html)
- **Markdown**: [docs/generated/api-documentation.md](docs/generated/api-documentation.md)

## ⚡ Quick API Test

```bash
# Health check
curl http://localhost:3001/api/v1/system/health

# Find nearby divisions (example for Kyiv)
curl "http://localhost:3001/api/v1/divisions/nearby?lat=50.4501&lng=30.5234&limit=5"

# List countries
curl http://localhost:3001/api/v1/divisions/countries
```

## 🔄 Update Documentation

```bash
# Regenerate documentation after changes
bun run docs:generate

# Start local server for viewing static documentation
bun run docs:serve
```

---

**Start with**: [Swagger UI](http://localhost:3001/api/v1/docs/swagger) for interactive API exploration  
**Then explore**: [Practical examples](docs/EXAMPLES.md) for your use case 