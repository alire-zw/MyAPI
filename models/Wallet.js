const pool = require('../database/connection');

class Wallet {
  // Get all wallets
  static async getAll() {
    try {
      const [rows] = await pool.execute(`
        SELECT w.*, u.userName, s.apiKey, s.selectedAPI, s.selectedSubscribe
        FROM wallets w 
        JOIN users u ON w.userId = u.id 
        JOIN subscriptions s ON w.subscriptionId = s.id
        ORDER BY w.dateCreated DESC
      `);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching wallets: ${error.message}`);
    }
  }

  // Get wallet by ID
  static async getById(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT w.*, u.userName, s.apiKey, s.selectedAPI, s.selectedSubscribe
        FROM wallets w 
        JOIN users u ON w.userId = u.id 
        JOIN subscriptions s ON w.subscriptionId = s.id
        WHERE w.id = ?
      `, [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error fetching wallet: ${error.message}`);
    }
  }

  // Get wallets by user ID
  static async getByUserId(userId) {
    try {
      const [rows] = await pool.execute(`
        SELECT w.*, u.userName, s.apiKey, s.selectedAPI, s.selectedSubscribe
        FROM wallets w 
        JOIN users u ON w.userId = u.id 
        JOIN subscriptions s ON w.subscriptionId = s.id
        WHERE w.userId = ?
        ORDER BY w.dateCreated DESC
      `, [userId]);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching user wallets: ${error.message}`);
    }
  }

  // Get wallets by subscription ID
  static async getBySubscriptionId(subscriptionId) {
    try {
      const [rows] = await pool.execute(`
        SELECT w.*, u.userName, s.apiKey, s.selectedAPI, s.selectedSubscribe
        FROM wallets w 
        JOIN users u ON w.userId = u.id 
        JOIN subscriptions s ON w.subscriptionId = s.id
        WHERE w.subscriptionId = ?
        ORDER BY w.dateCreated DESC
      `, [subscriptionId]);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching subscription wallets: ${error.message}`);
    }
  }

  // Get wallet by address
  static async getByAddress(address) {
    try {
      const [rows] = await pool.execute(`
        SELECT w.*, u.userName, s.apiKey, s.selectedAPI, s.selectedSubscribe
        FROM wallets w 
        JOIN users u ON w.userId = u.id 
        JOIN subscriptions s ON w.subscriptionId = s.id
        WHERE w.walletAddress = ?
      `, [address]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error fetching wallet by address: ${error.message}`);
    }
  }

  // Check if subscription already has a wallet
  static async hasWalletForSubscription(subscriptionId) {
    try {
      const [rows] = await pool.execute(
        'SELECT COUNT(*) as count FROM wallets WHERE subscriptionId = ?',
        [subscriptionId]
      );
      return rows[0].count > 0;
    } catch (error) {
      throw new Error(`Error checking wallet existence: ${error.message}`);
    }
  }

  // Create new wallet
  static async create(walletData) {
    try {
      const { subscriptionId, userId, walletAddress, mnemonics, publicKey, privateKey, tonApiKey, workchain = 0, version = 'v4r2' } = walletData;
      
      // Check if subscription already has a wallet
      const hasWallet = await this.hasWalletForSubscription(subscriptionId);
      if (hasWallet) {
        throw new Error('Subscription already has a wallet');
      }

      // Check if subscription exists and is valid
      const [subscriptionRows] = await pool.execute(
        'SELECT id, selectedUser FROM subscriptions WHERE id = ? AND dateRevoked IS NULL',
        [subscriptionId]
      );
      
      if (subscriptionRows.length === 0) {
        throw new Error('Subscription not found or revoked');
      }

      // Check if user exists
      const [userRows] = await pool.execute(
        'SELECT id FROM users WHERE id = ?',
        [userId]
      );
      
      if (userRows.length === 0) {
        throw new Error('User not found');
      }

      const [result] = await pool.execute(
        'INSERT INTO wallets (subscriptionId, userId, walletAddress, mnemonics, publicKey, privateKey, tonApiKey, workchain, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [subscriptionId, userId, walletAddress, mnemonics, publicKey, privateKey, tonApiKey || '', workchain, version]
      );

      return await this.getById(result.insertId);
    } catch (error) {
      throw new Error(`Error creating wallet: ${error.message}`);
    }
  }

  // Update wallet
  static async update(id, updateData) {
    try {
      const { walletAddress, mnemonics, publicKey, privateKey, tonApiKey, workchain, version } = updateData;
      const updates = [];
      const values = [];

      if (walletAddress !== undefined) {
        updates.push('walletAddress = ?');
        values.push(walletAddress);
      }

      if (mnemonics !== undefined) {
        updates.push('mnemonics = ?');
        values.push(mnemonics);
      }

      if (publicKey !== undefined) {
        updates.push('publicKey = ?');
        values.push(publicKey);
      }

      if (privateKey !== undefined) {
        updates.push('privateKey = ?');
        values.push(privateKey);
      }

      if (tonApiKey !== undefined) {
        updates.push('tonApiKey = ?');
        values.push(tonApiKey);
      }

      if (workchain !== undefined) {
        updates.push('workchain = ?');
        values.push(workchain);
      }

      if (version !== undefined) {
        updates.push('version = ?');
        values.push(version);
      }

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(id);
      const [result] = await pool.execute(
        `UPDATE wallets SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      if (result.affectedRows === 0) {
        throw new Error('Wallet not found');
      }

      return await this.getById(id);
    } catch (error) {
      throw new Error(`Error updating wallet: ${error.message}`);
    }
  }

  // Delete wallet
  static async delete(id) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM wallets WHERE id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        throw new Error('Wallet not found');
      }

      return { message: 'Wallet deleted successfully' };
    } catch (error) {
      throw new Error(`Error deleting wallet: ${error.message}`);
    }
  }

  // Get wallet statistics
  static async getStats() {
    try {
      const [totalRows] = await pool.execute('SELECT COUNT(*) as total FROM wallets');
      const [userStats] = await pool.execute(`
        SELECT u.userName, COUNT(*) as walletCount 
        FROM wallets w 
        JOIN users u ON w.userId = u.id 
        GROUP BY w.userId, u.userName
        ORDER BY walletCount DESC
      `);
      
      const [apiStats] = await pool.execute(`
        SELECT s.selectedAPI, COUNT(*) as count 
        FROM wallets w 
        JOIN subscriptions s ON w.subscriptionId = s.id 
        GROUP BY s.selectedAPI
      `);

      return {
        total: totalRows[0].total,
        userStats,
        apiStats
      };
    } catch (error) {
      throw new Error(`Error fetching wallet stats: ${error.message}`);
    }
  }
}

module.exports = Wallet; 