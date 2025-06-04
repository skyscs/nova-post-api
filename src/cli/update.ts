#!/usr/bin/env bun

import { UpdateService } from '../services/updateService';
import { logger } from '../utils/logger';

const updateService = new UpdateService();

async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'check':
      await checkUpdates();
      break;
    case 'update':
      await performUpdate();
      break;
    case 'load-file':
      const filePath = process.argv[3];
      if (!filePath) {
        console.error('Usage: bun run cli/update.ts load-file <path>');
        process.exit(1);
      }
      await loadFromFile(filePath);
      break;
    case 'update-api':
      const limit = process.argv[3] ? parseInt(process.argv[3]) : undefined;
      await updateFromApi(limit);
      break;
    case 'status':
      await getStatus();
      break;
    case 'history':
      const historyLimit = process.argv[3] ? parseInt(process.argv[3]) : 10;
      await getHistory(historyLimit);
      break;
    default:
      printUsage();
  }
}

async function checkUpdates() {
  try {
    console.log('🔍 Checking for updates...');
    
    // Get last successful update from history
    const history = await updateService.getUpdateHistory(50);
    const lastSuccessful = history.find(update => update.status === 'completed');
    
    // Get current system status  
    const status = await updateService.getUpdateStatus();
    
    console.log('📊 Current status:');
    console.log(`   Last update: ${lastSuccessful ? new Date(lastSuccessful.completed_at!).toLocaleString() : 'Never'}`);
    console.log(`   Divisions in DB: ${status.divisions.count}`);
    console.log(`   Countries: ${status.countries.count}`);
    console.log(`   Cities: ${status.cities.count}`);
    
    if (lastSuccessful) {
      console.log(`   Last update message: ${lastSuccessful.message}`);
      console.log(`   Divisions processed: ${lastSuccessful.divisions_count || 'Unknown'}`);
    }
    
    console.log('');
    console.log('💡 Use "bun run cli/update.ts update" to check and apply updates');
  } catch (error) {
    console.error('❌ Failed to check updates:', error);
    process.exit(1);
  }
}

async function performUpdate() {
  try {
    console.log('🚀 Starting update process...');
    const updated = await updateService.checkForUpdates();
    
    if (updated) {
      console.log('✅ Database updated successfully!');
    } else {
      console.log('ℹ️  No updates were needed');
    }
  } catch (error) {
    console.error('❌ Update failed:', error);
    process.exit(1);
  }
}

async function loadFromFile(filePath: string) {
  try {
    console.log(`📁 Loading data from file: ${filePath}`);
    const result = await updateService.updateFromFile(filePath);
    
    if (result.success) {
      console.log('✅ Data loaded successfully!');
      console.log(`   Message: ${result.message}`);
      if (result.stats) {
        console.log(`   Stats: ${JSON.stringify(result.stats, null, 2)}`);
      }
    } else {
      console.error('❌ Failed to load data:', result.message);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Failed to load data:', error);
    process.exit(1);
  }
}

async function updateFromApi(limit?: number) {
  try {
    console.log('🌐 Updating from NovaPost API...');
    if (limit) {
      console.log(`   Limit: ${limit} records`);
    }
    
    const result = await updateService.updateFromApi(limit);
    
    if (result.success) {
      console.log('✅ Data updated successfully!');
      console.log(`   Message: ${result.message}`);
      if (result.stats) {
        console.log(`   Stats: ${JSON.stringify(result.stats, null, 2)}`);
      }
    } else {
      console.error('❌ Failed to update data:', result.message);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Failed to update data:', error);
    process.exit(1);
  }
}

async function getStatus() {
  try {
    const status = await updateService.getUpdateStatus();
    console.log('📊 System Status:');
    console.log(JSON.stringify(status, null, 2));
  } catch (error) {
    console.error('❌ Failed to get status:', error);
    process.exit(1);
  }
}

async function getHistory(limit: number) {
  try {
    console.log(`📋 Update History (last ${limit} updates):`);
    const history = await updateService.getUpdateHistory(limit);
    
    if (history.length === 0) {
      console.log('   No update history found');
    } else {
      history.forEach((update, index) => {
        console.log(`   ${index + 1}. ${new Date(update.started_at).toLocaleString()}`);
        console.log(`      Status: ${update.status}`);
        console.log(`      Message: ${update.message || 'No message'}`);
        if (update.divisions_count) {
          console.log(`      Divisions: ${update.divisions_count}`);
        }
        if (update.completed_at) {
          console.log(`      Completed: ${new Date(update.completed_at).toLocaleString()}`);
        }
        console.log('');
      });
    }
  } catch (error) {
    console.error('❌ Failed to get history:', error);
    process.exit(1);
  }
}

function printUsage() {
  console.log('📖 NovaPost Database Update CLI');
  console.log('');
  console.log('Usage:');
  console.log('  bun run cli/update.ts <command> [options]');
  console.log('');
  console.log('Commands:');
  console.log('  check                    - Check for available updates');
  console.log('  update                   - Perform database update');
  console.log('  load-file <path>         - Load data from JSON file');
  console.log('  update-api [limit]       - Update from NovaPost API');
  console.log('  status                   - Show current status');
  console.log('  history [limit]          - Show update history');
  console.log('');
  console.log('Examples:');
  console.log('  bun run cli/update.ts check');
  console.log('  bun run cli/update.ts update');
  console.log('  bun run cli/update.ts load-file ./data.json');
  console.log('  bun run cli/update.ts update-api 1000');
  console.log('  bun run cli/update.ts history 5');
}

if (require.main === module) {
  main().catch((error) => {
    logger.error('CLI error:', error);
    process.exit(1);
  });
} 