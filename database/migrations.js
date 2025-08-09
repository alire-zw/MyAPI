const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

class DatabaseMigrations {
  static async getConnection() {
    return await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'alireza_db',
      port: process.env.DB_PORT || 3306
    });
  }

  // Migration 1: Add tonApiKey to wallets table
  static async addTonApiKeyToWallets() {
    let connection;
    try {
      connection = await this.getConnection();
      
      // Check if column already exists
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'wallets' AND COLUMN_NAME = 'tonApiKey'
      `, [process.env.DB_NAME || 'alireza_db']);

      if (columns.length === 0) {
        await connection.execute(`
          ALTER TABLE wallets 
          ADD COLUMN tonApiKey VARCHAR(255) NOT NULL DEFAULT '' AFTER privateKey
        `);
        console.log('✅ Migration 1: Added tonApiKey column to wallets table');
      } else {
        console.log('ℹ️  Migration 1: tonApiKey column already exists in wallets table');
      }

    } catch (error) {
      console.error('❌ Migration 1 failed:', error.message);
      throw error;
    } finally {
      if (connection) await connection.end();
    }
  }

  // Migration 2: Add cfClearance to fragment_user_data table
  static async addCfClearanceToFragmentData() {
    let connection;
    try {
      connection = await this.getConnection();
      
      // Check if column already exists
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'fragment_user_data' AND COLUMN_NAME = 'cfClearance'
      `, [process.env.DB_NAME || 'alireza_db']);

      if (columns.length === 0) {
        await connection.execute(`
          ALTER TABLE fragment_user_data 
          ADD COLUMN cfClearance TEXT NULL AFTER stelToken
        `);
        console.log('✅ Migration 2: Added cfClearance column to fragment_user_data table');
      } else {
        console.log('ℹ️  Migration 2: cfClearance column already exists in fragment_user_data table');
      }

    } catch (error) {
      console.error('❌ Migration 2 failed:', error.message);
      throw error;
    } finally {
      if (connection) await connection.end();
    }
  }

  // Migration 3: Add indexes for performance
  static async addPerformanceIndexes() {
    let connection;
    try {
      connection = await this.getConnection();
      
      // Add index on tonApiKey if not exists
      const [walletIndexes] = await connection.execute(`
        SHOW INDEX FROM wallets WHERE Key_name = 'idx_ton_api_key'
      `);

      if (walletIndexes.length === 0) {
        await connection.execute(`
          ALTER TABLE wallets ADD INDEX idx_ton_api_key (tonApiKey)
        `);
        console.log('✅ Migration 3a: Added index on tonApiKey');
      } else {
        console.log('ℹ️  Migration 3a: Index on tonApiKey already exists');
      }

      // Add index on isActive + userId for fragment_user_data
      const [fragmentIndexes] = await connection.execute(`
        SHOW INDEX FROM fragment_user_data WHERE Key_name = 'idx_active_user'
      `);

      if (fragmentIndexes.length === 0) {
        await connection.execute(`
          ALTER TABLE fragment_user_data ADD INDEX idx_active_user (isActive, userId)
        `);
        console.log('✅ Migration 3b: Added composite index on isActive + userId');
      } else {
        console.log('ℹ️  Migration 3b: Composite index already exists');
      }

    } catch (error) {
      console.error('❌ Migration 3 failed:', error.message);
      throw error;
    } finally {
      if (connection) await connection.end();
    }
  }

  // Run all migrations
  static async runAll() {
    try {
      console.log('🚀 Starting database migrations...');
      
      await this.addTonApiKeyToWallets();
      await this.addCfClearanceToFragmentData();
      await this.addPerformanceIndexes();
      
      console.log('🎉 All migrations completed successfully!');
      
    } catch (error) {
      console.error('❌ Migration process failed:', error.message);
      process.exit(1);
    }
  }

  // Rollback migrations (for development)
  static async rollback() {
    let connection;
    try {
      connection = await this.getConnection();
      
      console.log('🔄 Rolling back migrations...');
      
      // Remove added columns (use with caution!)
      try {
        await connection.execute('ALTER TABLE wallets DROP COLUMN tonApiKey');
        console.log('✅ Removed tonApiKey column');
      } catch (e) {
        console.log('ℹ️  tonApiKey column did not exist');
      }

      try {
        await connection.execute('ALTER TABLE fragment_user_data DROP COLUMN cfClearance');
        console.log('✅ Removed cfClearance column');
      } catch (e) {
        console.log('ℹ️  cfClearance column did not exist');
      }

      // Remove indexes
      try {
        await connection.execute('ALTER TABLE wallets DROP INDEX idx_ton_api_key');
        console.log('✅ Removed tonApiKey index');
      } catch (e) {
        console.log('ℹ️  tonApiKey index did not exist');
      }

      try {
        await connection.execute('ALTER TABLE fragment_user_data DROP INDEX idx_active_user');
        console.log('✅ Removed composite index');
      } catch (e) {
        console.log('ℹ️  Composite index did not exist');
      }

      console.log('🎉 Rollback completed!');
      
    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
      throw error;
    } finally {
      if (connection) await connection.end();
    }
  }
}

// CLI commands
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'migrate':
      DatabaseMigrations.runAll();
      break;
    case 'rollback':
      DatabaseMigrations.rollback();
      break;
    default:
      console.log('Usage: node migrations.js [migrate|rollback]');
      process.exit(1);
  }
}

module.exports = DatabaseMigrations;
