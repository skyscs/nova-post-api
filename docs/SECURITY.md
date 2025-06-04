# Security Guidelines

## Database Update Security

### Removed Public Endpoints

For security reasons, the following public endpoints have been **removed** from the API:

- `POST /api/v1/system/update` - Manual database update trigger
- `POST /api/v1/system/load-data` - Load data from file
- `POST /api/v1/system/update-from-api` - Update from NovaPost API

### Security Risks of Public Update Endpoints

1. **DoS Attacks**: Malicious users could trigger resource-intensive updates repeatedly
2. **Database Corruption**: Concurrent update attempts could cause data inconsistency
3. **Resource Exhaustion**: Large data updates (500MB+) consume significant server resources
4. **Unauthorized Access**: No authentication means anyone can modify the database

## Current Update Mechanisms

### 1. Automatic Cron Jobs
- Daily updates at 03:00 AM (server time)
- Configured in `src/index.ts`
- Automatically checks for new data and updates the database

### 2. Manual CLI Commands (Server Access Required)

To manually trigger updates, you must have direct access to the server:

```bash
# Check system status
bun run cli:status

# Check for available updates  
bun run cli:check

# Perform database update
bun run cli:update

# Load data from specific file
bun src/cli/update.ts load-file /path/to/data.json

# Update from NovaPost API with limit
bun src/cli/update.ts update-api 10000

# View update history
bun run cli:history
```

### 3. Available Public Endpoints (Read-Only)

The following endpoints remain available for monitoring:

- `GET /api/v1/system/health` - Service health check
- `GET /api/v1/system/status` - Database statistics
- `GET /api/v1/system/update-status` - Last update information
- `GET /api/v1/system/updates/history` - Update history

## Best Practices

1. **Server Access**: Only administrators with SSH access can trigger manual updates
2. **Monitoring**: Use the read-only endpoints to monitor system status
3. **Logs**: Check application logs for update status and errors
4. **Backup**: Ensure database backups before major updates
5. **Resource Monitoring**: Monitor server resources during large updates

## Emergency Procedures

If the automatic cron job fails:

1. SSH to the server
2. Check logs: `docker-compose logs nova-post-api`
3. Run manual update: `bun run cli:update`
4. Verify with: `bun run cli:status`

## Future Enhancements

Consider implementing:
- API key authentication for update endpoints
- Role-based access control
- Update scheduling interface
- Webhook notifications for update status 