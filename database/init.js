const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function initializeDatabase() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306
    });

    console.log('🔗 Connecting to MySQL server...');

    const dbName = process.env.DB_NAME || 'alireza_db';
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✅ Database '${dbName}' created or already exists`);

    // Close connection and reconnect with database
    await connection.end();

    // Reconnect with database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: dbName,
      port: process.env.DB_PORT || 3306
    });

    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userName VARCHAR(255) NOT NULL UNIQUE,
        userPassword VARCHAR(255) NOT NULL,
        isBanned BOOLEAN DEFAULT FALSE,
        dateJoined TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_username (userName),
        INDEX idx_date_joined (dateJoined)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.execute(createUsersTable);
    console.log('✅ Users table created successfully');

    // Create subscriptions table
    const createSubscriptionsTable = `
      CREATE TABLE IF NOT EXISTS subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        selectedUser INT NOT NULL,
        selectedAPI ENUM('Fragment', 'Item2', 'Item3') NOT NULL,
        selectedSubscribe ENUM('Trial', '1 Month', '3 Month', '1 Year') NOT NULL,
        apiKey VARCHAR(255) NOT NULL UNIQUE,
        dateCreated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        dateRevoked TIMESTAMP NULL,
        FOREIGN KEY (selectedUser) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user (selectedUser),
        INDEX idx_api_key (apiKey),
        INDEX idx_date_created (dateCreated)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.execute(createSubscriptionsTable);
    console.log('✅ Subscriptions table created successfully');

    // Create wallets table
    const createWalletsTable = `
      CREATE TABLE IF NOT EXISTS wallets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        subscriptionId INT NOT NULL,
        userId INT NOT NULL,
        walletAddress VARCHAR(255) NOT NULL,
        mnemonics TEXT NOT NULL,
        publicKey TEXT NOT NULL,
        privateKey TEXT NOT NULL,
        workchain INT DEFAULT 0,
        version VARCHAR(10) DEFAULT 'v4r2',
        dateCreated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (subscriptionId) REFERENCES subscriptions(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_subscription (subscriptionId),
        INDEX idx_user (userId),
        INDEX idx_address (walletAddress),
        INDEX idx_date_created (dateCreated)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.execute(createWalletsTable);
    console.log('✅ Wallets table created successfully');

    // Create fragment_user_data table
    const createFragmentUserDataTable = `
      CREATE TABLE IF NOT EXISTS fragment_user_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        fragmentHash VARCHAR(255) NOT NULL,
        fragmentPublicKey TEXT NOT NULL,
        fragmentWallets TEXT NOT NULL,
        fragmentAddress VARCHAR(255) NOT NULL,
        stelSsid VARCHAR(255) NOT NULL,
        stelDt VARCHAR(50) NOT NULL,
        stelTonToken TEXT NOT NULL,
        stelToken VARCHAR(255) NOT NULL,
        isActive BOOLEAN DEFAULT TRUE,
        dateCreated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        dateUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user (userId),
        INDEX idx_fragment_hash (fragmentHash),
        INDEX idx_is_active (isActive),
        INDEX idx_date_created (dateCreated)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.execute(createFragmentUserDataTable);
    console.log('✅ Fragment user data table created successfully');

    const sampleUser = {
      userName: 'admin',
      userPassword: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
      isBanned: false
    };

    const insertSampleUser = `
      INSERT IGNORE INTO users (userName, userPassword, isBanned)
      VALUES (?, ?, ?)
    `;

    await connection.execute(insertSampleUser, [
      sampleUser.userName,
      sampleUser.userPassword,
      sampleUser.isBanned
    ]);

    console.log('✅ Sample user created (username: admin, password: password)');

    // Insert a sample subscription
    const sampleSubscription = {
      selectedUser: 1,
      selectedAPI: 'Fragment',
      selectedSubscribe: 'Trial',
      apiKey: 'miral:14156:ashIKFDascXffs'
    };

    const insertSampleSubscription = `
      INSERT IGNORE INTO subscriptions (selectedUser, selectedAPI, selectedSubscribe, apiKey)
      VALUES (?, ?, ?, ?)
    `;

    await connection.execute(insertSampleSubscription, [
      sampleSubscription.selectedUser,
      sampleSubscription.selectedAPI,
      sampleSubscription.selectedSubscribe,
      sampleSubscription.apiKey
    ]);

    console.log('✅ Sample subscription created');
    console.log('🎉 Database initialization completed successfully!');

  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase }; 