# Simplified Update System

## Overview

The update system has been **simplified** to eliminate confusion and improve reliability:

- ❌ **Removed**: Complex version checking logic
- ❌ **Removed**: File-based updates (`load-file`, `update-from-file`)
- ❌ **Removed**: Multiple update methods (`update-api`, `force-update-api`)
- ✅ **Kept**: Simple daily updates **ALWAYS from NovaPost API**

## How It Works Now

### 1. Cron Job (Automatic)
```
Every day at 2:00 AM → Download from NovaPost API → Update database
```

**No complex logic** - just always get fresh data from NovaPost and update the database.

### 2. Manual Commands

#### Check Status
```bash
bun src/cli/update.ts status
```

#### Manual Update (same as cron)
```bash
bun src/cli/update.ts update
```

#### Emergency Reset
```bash
bun src/cli/update.ts force-update
```

## Key Changes

### Before (Complex)
```typescript
// Complex version checking
const apiData = response.data;
const latestVersion = apiData.deltas.length > 0 ? 
  apiData.deltas[apiData.deltas.length - 1] : apiData.base_version;

const lastUpdate = await this.getLastSuccessfulUpdate();
const latestTimestamp = 'unix_time_till' in latestVersion ? 
  latestVersion.unix_time_till : latestVersion.unix_time;

if (!lastUpdate || latestTimestamp > (lastUpdate.completed_at?.getTime() || 0) / 1000) {
  // Maybe update...
}
```

### After (Simple)
```typescript
// Always update from API
async checkForUpdates(): Promise<boolean> {
  logger.info('Starting daily database update from NovaPost API');
  const result = await this.updateFromApi();
  return result.success;
}
```

## Available CLI Commands

| Command | Description |
|---------|-------------|
| `status` | Show database statistics |
| `update` | Update from NovaPost API (same as cron) |
| `history` | Show update history |
| `force-update` | Clear all data + fresh download |
| `clear-all` | Clear database (destructive) |

## Removed Commands

| Removed Command | Reason |
|-----------------|--------|
| `check` | Redundant - just use `status` |
| `load-file` | Files cause confusion |
| `update-api` | Same as `update` now |
| `force-update-api` | Same as `force-update` now |

## Testing

### Test the exact cron logic:
```bash
# This runs exactly the same code as the cron job
bun src/cli/update.ts update
```

### Expected behavior:
- **Empty database**: Downloads ~260k divisions from NovaPost API
- **Existing data**: Replaces with fresh data from NovaPost API  
- **API issues**: Logs error and fails gracefully

## Benefits

1. **No Confusion**: Only one data source (NovaPost API)
2. **Always Fresh**: No stale file data
3. **Predictable**: Same logic for cron and manual updates
4. **Reliable**: No complex version comparison bugs
5. **Simple**: Easy to understand and maintain

## Migration

### Old Commands → New Commands
```bash
# Old way
bun src/cli/update.ts check         → bun src/cli/update.ts status
bun src/cli/update.ts update-api    → bun src/cli/update.ts update  
bun src/cli/update.ts load-file     → NOT NEEDED (removed)
```

### Configuration

No changes needed - same environment variables:
- `UPDATE_CRON=0 2 * * *` (daily at 2 AM)
- `NOVA_POST_API_URL=https://api-cdn.novapost.pl/...`

## Troubleshooting

### Issue: "No updates were needed" but database is empty

**Before**: Complex version checking was broken
**After**: This can't happen - always updates from API

### Issue: Confused about which command to use

**Before**: `check`, `update`, `update-api`, `load-file`, etc.
**After**: Just use `update` - it's the same as cron

### Issue: Database corrupted

**Before**: Multiple update paths could cause issues  
**After**: One simple path - always from NovaPost API

## Monitoring

Same monitoring endpoints work:
- `GET /api/v1/system/status`
- `GET /api/v1/system/health` 
- `GET /api/v1/system/update-status`
- `GET /api/v1/system/updates/history`

## Summary

**Old system**: "Maybe update if version is newer, from various sources"
**New system**: "Always update from NovaPost API, period."

Much simpler, more reliable, and eliminates the confusion that caused your database to be empty. 