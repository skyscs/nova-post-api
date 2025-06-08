# Quick Cron Test Guide

## TL;DR - How to manually test the cron process

### Prerequisites
```bash
# Start database first
docker-compose up -d postgres
```

### Test Commands

#### 1. Check if cron would run
```bash
bun src/cli/update.ts check
```

#### 2. Manually trigger cron process
```bash
# This runs EXACTLY the same code as the cron job
bun src/cli/update.ts update
```

#### 3. Verify results
```bash
bun src/cli/update.ts status
bun src/cli/update.ts history 3
```

## Expected Results

### If database is empty:
```bash
bun src/cli/update.ts update
# Output: ✅ Database updated successfully!
```

### If database is up-to-date:
```bash
bun src/cli/update.ts update  
# Output: ℹ️  No updates were needed
```

### Check counts:
```bash
bun src/cli/update.ts status
# Should show: ~259k divisions, ~49k cities, ~22 countries
```

## Quick Troubleshooting

### Database connection refused?
```bash
docker-compose up -d postgres
# Wait 10 seconds, then retry
```

### Database empty after update?
```bash
# Force reload from local file
bun src/cli/update.ts load-file ./base.json
```

### Test external API:
```bash
curl "https://api-cdn.novapost.pl/dictionary/divisions/mobile/full/uk/versions.json"
# Should return JSON with version info
```

## What the cron job does

1. Checks NovaPost API for new version
2. Compares with last successful update
3. If newer: downloads 402MB file → parses → safely updates DB
4. If same: logs "no updates available"

## Cron schedule
- **Current**: `0 2 * * *` (daily at 2:00 AM)
- **Change**: Set `UPDATE_CRON` environment variable

---

**Full documentation**: [MANUAL_CRON_TESTING.md](./MANUAL_CRON_TESTING.md) 