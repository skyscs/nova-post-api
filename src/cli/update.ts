#!/usr/bin/env bun

import { UpdateService } from '../services/updateService';
import { logger } from '../utils/logger';

const updateService = new UpdateService();

async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'status':
      await getStatus();
      break;
    case 'update':
      await performUpdate();
      break;
    case 'history':
      const historyLimit = process.argv[3] ? parseInt(process.argv[3]) : 10;
      await getHistory(historyLimit);
      break;
    case 'force-update':
      await forceUpdate();
      break;
    case 'clear-all':
      await clearAllData();
      break;
    default:
      printUsage();
  }
}



async function performUpdate() {
  try {
    console.log('🚀 Starting database update from NovaPost API...');
    const updated = await updateService.checkForUpdates();
    
    if (updated) {
      console.log('✅ Database updated successfully!');
    } else {
      console.log('❌ Update failed - check logs for details');
    }
  } catch (error) {
    console.error('❌ Update failed:', error);
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

async function forceUpdate() {
  try {
    console.log('💥 Starting FORCE update (clearing all data)...');
    console.log('⚠️  This will delete ALL existing data and download fresh data from API');
    
    // Ask for confirmation
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise<string>((resolve) => {
      rl.question('Are you sure? Type "yes" to continue: ', resolve);
    });
    rl.close();
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled');
      return;
    }
    
    const result = await updateService.forceUpdate();
    
    if (result.success) {
      console.log('✅ Force update completed successfully!');
      console.log(`   Message: ${result.message}`);
      if (result.stats) {
        console.log(`   Stats: ${JSON.stringify(result.stats, null, 2)}`);
      }
    } else {
      console.error('❌ Force update failed:', result.message);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Force update failed:', error);
    process.exit(1);
  }
}



async function clearAllData() {
  try {
    console.log('💥 Clearing ALL data from database...');
    console.log('⚠️  This will delete ALL divisions, cities, countries, and parent_regions');
    
    // Ask for confirmation
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise<string>((resolve) => {
      rl.question('Are you sure? Type "DELETE" to continue: ', resolve);
    });
    rl.close();
    
    if (answer !== 'DELETE') {
      console.log('❌ Operation cancelled');
      return;
    }
    
    await updateService.clearAllData();
    console.log('✅ All data cleared successfully!');
  } catch (error) {
    console.error('❌ Failed to clear data:', error);
    process.exit(1);
  }
}

function printUsage() {
  console.log('📖 NovaPost Database Update CLI');
  console.log('');
  console.log('Usage:');
  console.log('  bun run cli/update.ts <command>');
  console.log('');
  console.log('Commands:');
  console.log('  status                   - Show current database status');
  console.log('  update                   - Update database from NovaPost API');
  console.log('  history [limit]          - Show update history');
  console.log('');
  console.log('💥 FORCE COMMANDS (destructive):');
  console.log('  force-update             - Clear ALL data & download fresh from API');
  console.log('  clear-all                - Clear ALL data from database');
  console.log('');
  console.log('Examples:');
  console.log('  bun run cli/update.ts status');
  console.log('  bun run cli/update.ts update');
  console.log('  bun run cli/update.ts history 5');
  console.log('  bun run cli/update.ts force-update');
}

if (require.main === module) {
  main().catch((error) => {
    logger.error('CLI error:', error);
    process.exit(1);
  });
} 