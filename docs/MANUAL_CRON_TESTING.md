# Manual Cron Process Testing Guide

This guide explains how to manually trigger and test the automated update process (cron job) to ensure it works correctly.

## Prerequisites

1. **Database Running**: PostgreSQL with PostGIS must be running
2. **Server Access**: SSH access to the server or local development environment
3. **Dependencies**: Bun runtime installed

## Testing Methods

### Method 1: CLI Commands (Recommended)

These commands directly test the same logic that runs in the cron job:

#### 1. Check System Status
```bash
# Get current database statistics
bun src/cli/update.ts status
```

**Expected Output:**
```json
{
  "divisions": {
    "count": 259123,
    "last_update": "2025-06-08T02:00:15.123Z"
  },
  "countries": {
    "count": 22
  },
  "cities": {
    "count": 49092
  }
}
```

#### 2. Check for Available Updates
```bash
# Check if updates are available (same logic as cron)
bun src/cli/update.ts check
```

**Expected Output:**
```
🔍 Checking for updates...
📊 Current status:
   Last update: 6/8/2025, 4:00:15 AM
   Divisions in DB: 259123
   Countries: 22
   Cities: 49092
   Last update message: Database updated successfully via cron job
   Divisions processed: 259123

💡 Use "bun run cli/update.ts update" to check and apply updates
```

#### 3. Manually Trigger Cron Process
```bash
# This runs EXACTLY the same code as the cron job
bun src/cli/update.ts update
```

**Expected Output (if updates available):**
```
🚀 Starting update process...
✅ Database updated successfully!
```

**Expected Output (if no updates):**
```
🚀 Starting update process...
ℹ️  No updates were needed
```

#### 4. View Update History
```bash
# Check the last 10 update attempts
bun src/cli/update.ts history 10
```

**Expected Output:**
```
📋 Update History (last 10 updates):
   1. 6/8/2025, 2:00:15 AM
      Status: completed
      Message: Database updated successfully via cron job
      Divisions: 259123
      Completed: 6/8/2025, 2:00:17 AM

   2. 6/7/2025, 2:00:12 AM
      Status: completed
      Message: No updates available via cron job
      Divisions: 0
      Completed: 6/7/2025, 2:00:13 AM
```

### Method 2: API Endpoints (Read-Only Monitoring)

These endpoints allow monitoring without server access:

#### 1. Health Check
```bash
curl "http://localhost:3001/api/v1/system/health"
```

**Expected Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-06-08T09:45:12.123Z"
}
```

#### 2. System Status
```bash
curl "http://localhost:3001/api/v1/system/status"
```

**Expected Response:**
```json
{
  "divisions": {
    "count": 259123,
    "last_update": "2025-06-08T02:00:15.123Z"
  },
  "countries": {
    "count": 22
  },
  "cities": {
    "count": 49092
  }
}
```

#### 3. Last Update Status
```bash
curl "http://localhost:3001/api/v1/system/update-status"
```

#### 4. Update History
```bash
curl "http://localhost:3001/api/v1/system/updates/history"
```

### Method 3: Direct NovaPost API Testing

Test the external API connectivity:

```bash
# Test NovaPost API endpoint
curl "https://api-cdn.novapost.pl/dictionary/divisions/mobile/full/uk/versions.json"
```

This should return version information like:
```json
{
  "base_version": {
    "url": "https://...",
    "unix_time": 1717804800
  },
  "deltas": [...]
}
```

## Common Issues & Troubleshooting

### Issue 1: Database Connection Refused

**Symptoms:**
```
❌ Failed to get status: error: Failed to connect
syscall: "connect", errno: 1, code: "ECONNREFUSED"
```

**Solutions:**
1. **Start Database:**
   ```bash
   docker-compose up -d postgres
   ```

2. **Check Database Status:**
   ```bash
   docker-compose ps
   ```

3. **Check Database Logs:**
   ```bash
   docker-compose logs postgres
   ```

### Issue 2: No Database Data

**Symptoms:**
```json
{
  "divisions": { "count": 0 },
  "countries": { "count": 0 },
  "cities": { "count": 0 }
}
```

**Solutions:**
1. **Force Database Reload:**
   ```bash
   bun src/cli/update.ts force-update
   ```

2. **Load from Local File:**
   ```bash
   bun src/cli/update.ts load-file ./base.json
   ```

### Issue 3: Cron Job Not Running

**Check if cron job is configured:**
1. Server logs should show: `Starting scheduled database update`
2. Check cron expression: `UPDATE_CRON=0 2 * * *`
3. Verify server timezone matches expected schedule

### Issue 4: Updates Failing

**Check update logs:**
```bash
bun src/cli/update.ts history 20
```

**Look for failed updates and error details:**
- Network connectivity issues
- NovaPost API changes
- Database disk space
- Memory constraints

## Testing Schedule

### Daily Testing Routine

1. **Morning Check (after cron should have run):**
   ```bash
   bun src/cli/update.ts check
   bun src/cli/update.ts history 3
   ```

2. **Manual Test (if cron failed):**
   ```bash
   bun src/cli/update.ts update
   ```

### Weekly Testing Routine

1. **Force update test:**
   ```bash
   bun src/cli/update.ts force-update-api 1000
   ```

2. **Full system status:**
   ```bash
   bun src/cli/update.ts status
   ```

## Understanding Cron Logic

The cron job (`0 2 * * *` = daily at 2:00 AM) performs these steps:

1. **Fetch Version Info** from NovaPost API
2. **Compare Timestamps** with last successful update
3. **If newer version available:**
   - Download full database (402MB)
   - Parse NovaPost structure
   - Extract regions and cities
   - **Safely update** via temporary tables
   - Log success/failure
4. **If no updates:** Log "no updates available"

## Manual Cron Simulation

To simulate exactly what the cron job does:

```bash
# 1. Check what the cron would do
bun src/cli/update.ts check

# 2. If updates available, run the same logic
bun src/cli/update.ts update

# 3. Verify results
bun src/cli/update.ts status
bun src/cli/update.ts history 1
```

## Monitoring Alerts

Set up monitoring for these conditions:

1. **Database Empty:** `divisions.count < 1000`
2. **Updates Failing:** Recent history shows `failed` status
3. **No Recent Updates:** Last update > 48 hours ago
4. **API Down:** Health check fails

Example monitoring script:
```bash
#!/bin/bash
# check-nova-post.sh

STATUS=$(curl -s "http://localhost:3001/api/v1/system/status")
COUNT=$(echo $STATUS | jq '.divisions.count')

if [ "$COUNT" -lt 1000 ]; then
    echo "ALERT: Database appears empty (count: $COUNT)"
    exit 1
fi

echo "OK: Database healthy (count: $COUNT)"
```

## Emergency Procedures

### If Cron Job Corrupted Database:

1. **Stop Server** (prevent further damage):
   ```bash
   docker-compose stop api
   ```

2. **Restore from Backup** (if available):
   ```bash
   psql nova_post_db < /backups/nova_post_20250608.sql
   ```

3. **Or Force Reload:**
   ```bash
   bun src/cli/update.ts clear-all
   bun src/cli/update.ts force-update
   ```

4. **Restart Server:**
   ```bash
   docker-compose up -d api
   ```

5. **Verify:**
   ```bash
   bun src/cli/update.ts status
   ``` 