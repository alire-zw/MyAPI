const pool = require('../database/connection');
const crypto = require('crypto');

class Subscription {
  // Get all subscriptions
  static async getAll() {
    try {
      const [rows] = await pool.execute(`
        SELECT s.*, u.userName 
        FROM subscriptions s 
        JOIN users u ON s.selectedUser = u.id 
        ORDER BY s.dateCreated DESC
      `);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching subscriptions: ${error.message}`);
    }
  }

  // Get subscription by ID
  static async getById(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT s.*, u.userName 
        FROM subscriptions s 
        JOIN users u ON s.selectedUser = u.id 
        WHERE s.id = ?
      `, [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error fetching subscription: ${error.message}`);
    }
  }

  // Get subscriptions by user ID
  static async getByUserId(userId) {
    try {
      const [rows] = await pool.execute(`
        SELECT s.*, u.userName 
        FROM subscriptions s 
        JOIN users u ON s.selectedUser = u.id 
        WHERE s.selectedUser = ?
        ORDER BY s.dateCreated DESC
      `, [userId]);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching user subscriptions: ${error.message}`);
    }
  }

  // Get subscription by API key
  static async getByApiKey(apiKey) {
    try {
      const [rows] = await pool.execute(`
        SELECT s.*, u.userName 
        FROM subscriptions s 
        JOIN users u ON s.selectedUser = u.id 
        WHERE s.apiKey = ?
      `, [apiKey]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error fetching subscription by API key: ${error.message}`);
    }
  }

  // Generate API key
  static generateApiKey() {
    const randomId = Math.floor(Math.random() * 99999) + 10000; // 5-digit random number
    const randomString = crypto.randomBytes(4).toString('hex');
    return `miral:${randomId}:${randomString}`;
  }

  // Create new subscription
  static async create(subscriptionData) {
    try {
      const { selectedUser, selectedAPI, selectedSubscribe } = subscriptionData;
      
      // Check if user exists
      const [userRows] = await pool.execute(
        'SELECT id FROM users WHERE id = ?',
        [selectedUser]
      );
      
      if (userRows.length === 0) {
        throw new Error('User not found');
      }

      // Generate unique API key
      let apiKey;
      let isUnique = false;
      let attempts = 0;
      
      while (!isUnique && attempts < 10) {
        apiKey = this.generateApiKey();
        const [existingRows] = await pool.execute(
          'SELECT id FROM subscriptions WHERE apiKey = ?',
          [apiKey]
        );
        
        if (existingRows.length === 0) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        throw new Error('Could not generate unique API key');
      }

      const [result] = await pool.execute(
        'INSERT INTO subscriptions (selectedUser, selectedAPI, selectedSubscribe, apiKey) VALUES (?, ?, ?, ?)',
        [selectedUser, selectedAPI, selectedSubscribe, apiKey]
      );

      return await this.getById(result.insertId);
    } catch (error) {
      throw new Error(`Error creating subscription: ${error.message}`);
    }
  }

  // Update subscription
  static async update(id, updateData) {
    try {
      const { selectedAPI, selectedSubscribe, dateRevoked } = updateData;
      const updates = [];
      const values = [];

      if (selectedAPI !== undefined) {
        updates.push('selectedAPI = ?');
        values.push(selectedAPI);
      }

      if (selectedSubscribe !== undefined) {
        updates.push('selectedSubscribe = ?');
        values.push(selectedSubscribe);
      }

      if (dateRevoked !== undefined) {
        updates.push('dateRevoked = ?');
        values.push(dateRevoked);
      }

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(id);
      const [result] = await pool.execute(
        `UPDATE subscriptions SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      if (result.affectedRows === 0) {
        throw new Error('Subscription not found');
      }

      return await this.getById(id);
    } catch (error) {
      throw new Error(`Error updating subscription: ${error.message}`);
    }
  }

  // Delete subscription
  static async delete(id) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM subscriptions WHERE id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        throw new Error('Subscription not found');
      }

      return { message: 'Subscription deleted successfully' };
    } catch (error) {
      throw new Error(`Error deleting subscription: ${error.message}`);
    }
  }

  // Revoke API key
  static async revoke(id) {
    try {
      const subscription = await this.getById(id);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const [result] = await pool.execute(
        'UPDATE subscriptions SET dateRevoked = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );

      return await this.getById(id);
    } catch (error) {
      throw new Error(`Error revoking subscription: ${error.message}`);
    }
  }

  // Regenerate API key
  static async regenerateApiKey(id) {
    try {
      const subscription = await this.getById(id);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Generate new unique API key
      let apiKey;
      let isUnique = false;
      let attempts = 0;
      
      while (!isUnique && attempts < 10) {
        apiKey = this.generateApiKey();
        const [existingRows] = await pool.execute(
          'SELECT id FROM subscriptions WHERE apiKey = ? AND id != ?',
          [apiKey, id]
        );
        
        if (existingRows.length === 0) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        throw new Error('Could not generate unique API key');
      }

      const [result] = await pool.execute(
        'UPDATE subscriptions SET apiKey = ? WHERE id = ?',
        [apiKey, id]
      );

      return await this.getById(id);
    } catch (error) {
      throw new Error(`Error regenerating API key: ${error.message}`);
    }
  }

  // Check if API key is valid
  static async isValidApiKey(apiKey) {
    try {
      const subscription = await this.getByApiKey(apiKey);
      if (!subscription) {
        return false;
      }

      // Check if subscription is revoked
      if (subscription.dateRevoked) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  // Get subscription statistics
  static async getStats() {
    try {
      const [totalRows] = await pool.execute('SELECT COUNT(*) as total FROM subscriptions');
      const [activeRows] = await pool.execute('SELECT COUNT(*) as active FROM subscriptions WHERE dateRevoked IS NULL');
      const [revokedRows] = await pool.execute('SELECT COUNT(*) as revoked FROM subscriptions WHERE dateRevoked IS NOT NULL');
      
      const [apiStats] = await pool.execute(`
        SELECT selectedAPI, COUNT(*) as count 
        FROM subscriptions 
        GROUP BY selectedAPI
      `);
      
      const [subscribeStats] = await pool.execute(`
        SELECT selectedSubscribe, COUNT(*) as count 
        FROM subscriptions 
        GROUP BY selectedSubscribe
      `);

      return {
        total: totalRows[0].total,
        active: activeRows[0].active,
        revoked: revokedRows[0].revoked,
        apiStats,
        subscribeStats
      };
    } catch (error) {
      throw new Error(`Error fetching subscription stats: ${error.message}`);
    }
  }
}

module.exports = Subscription; 