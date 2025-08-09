const pool = require('../database/connection');

class FragmentUserData {
  // Get all fragment user data
  static async getAll() {
    try {
      const [rows] = await pool.execute(`
        SELECT fud.*, u.userName
        FROM fragment_user_data fud 
        JOIN users u ON fud.userId = u.id
        ORDER BY fud.dateCreated DESC
      `);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching fragment user data: ${error.message}`);
    }
  }

  // Get fragment user data by ID
  static async getById(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT fud.*, u.userName
        FROM fragment_user_data fud 
        JOIN users u ON fud.userId = u.id
        WHERE fud.id = ?
      `, [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error fetching fragment user data: ${error.message}`);
    }
  }

  // Get fragment user data by user ID
  static async getByUserId(userId) {
    try {
      const [rows] = await pool.execute(`
        SELECT fud.*, u.userName
        FROM fragment_user_data fud 
        JOIN users u ON fud.userId = u.id
        WHERE fud.userId = ?
        ORDER BY fud.dateCreated DESC
      `, [userId]);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching user fragment data: ${error.message}`);
    }
  }

  // Get active fragment user data by user ID
  static async getActiveByUserId(userId) {
    try {
      const [rows] = await pool.execute(`
        SELECT fud.*, u.userName
        FROM fragment_user_data fud 
        JOIN users u ON fud.userId = u.id
        WHERE fud.userId = ? AND fud.isActive = TRUE
        ORDER BY fud.dateCreated DESC
        LIMIT 1
      `, [userId]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error fetching active fragment user data: ${error.message}`);
    }
  }

  // Get fragment user data by fragment hash
  static async getByFragmentHash(fragmentHash) {
    try {
      const [rows] = await pool.execute(`
        SELECT fud.*, u.userName
        FROM fragment_user_data fud 
        JOIN users u ON fud.userId = u.id
        WHERE fud.fragmentHash = ?
      `, [fragmentHash]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error fetching fragment user data by hash: ${error.message}`);
    }
  }

  // Create new fragment user data
  static async create(fragmentData) {
    try {
      const { 
        userId, 
        fragmentHash, 
        fragmentPublicKey, 
        fragmentWallets, 
        fragmentAddress,
        stelSsid,
        stelDt,
        stelTonToken,
        stelToken,
        cfClearance
      } = fragmentData;
      
      // Check if user exists
      const [userRows] = await pool.execute(
        'SELECT id FROM users WHERE id = ?',
        [userId]
      );
      
      if (userRows.length === 0) {
        throw new Error('User not found');
      }

      // Deactivate other active records for this user
      await pool.execute(
        'UPDATE fragment_user_data SET isActive = FALSE WHERE userId = ?',
        [userId]
      );

      const [result] = await pool.execute(
        'INSERT INTO fragment_user_data (userId, fragmentHash, fragmentPublicKey, fragmentWallets, fragmentAddress, stelSsid, stelDt, stelTonToken, stelToken, cfClearance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, fragmentHash, fragmentPublicKey, fragmentWallets, fragmentAddress, stelSsid, stelDt, stelTonToken, stelToken, cfClearance || null]
      );

      return await this.getById(result.insertId);
    } catch (error) {
      throw new Error(`Error creating fragment user data: ${error.message}`);
    }
  }

  // Update fragment user data
  static async update(id, updateData) {
    try {
      const { 
        fragmentHash, 
        fragmentPublicKey, 
        fragmentWallets, 
        fragmentAddress,
        stelSsid,
        stelDt,
        stelTonToken,
        stelToken,
        cfClearance,
        isActive
      } = updateData;
      
      const updates = [];
      const values = [];

      if (fragmentHash !== undefined) {
        updates.push('fragmentHash = ?');
        values.push(fragmentHash);
      }

      if (fragmentPublicKey !== undefined) {
        updates.push('fragmentPublicKey = ?');
        values.push(fragmentPublicKey);
      }

      if (fragmentWallets !== undefined) {
        updates.push('fragmentWallets = ?');
        values.push(fragmentWallets);
      }

      if (fragmentAddress !== undefined) {
        updates.push('fragmentAddress = ?');
        values.push(fragmentAddress);
      }

      if (stelSsid !== undefined) {
        updates.push('stelSsid = ?');
        values.push(stelSsid);
      }

      if (stelDt !== undefined) {
        updates.push('stelDt = ?');
        values.push(stelDt);
      }

      if (stelTonToken !== undefined) {
        updates.push('stelTonToken = ?');
        values.push(stelTonToken);
      }

      if (stelToken !== undefined) {
        updates.push('stelToken = ?');
        values.push(stelToken);
      }

      if (cfClearance !== undefined) {
        updates.push('cfClearance = ?');
        values.push(cfClearance);
      }

      if (isActive !== undefined) {
        updates.push('isActive = ?');
        values.push(isActive);
      }

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(id);
      const [result] = await pool.execute(
        `UPDATE fragment_user_data SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      if (result.affectedRows === 0) {
        throw new Error('Fragment user data not found');
      }

      return await this.getById(id);
    } catch (error) {
      throw new Error(`Error updating fragment user data: ${error.message}`);
    }
  }

  // Delete fragment user data
  static async delete(id) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM fragment_user_data WHERE id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        throw new Error('Fragment user data not found');
      }

      return { message: 'Fragment user data deleted successfully' };
    } catch (error) {
      throw new Error(`Error deleting fragment user data: ${error.message}`);
    }
  }

  // Activate fragment user data
  static async activate(id) {
    try {
      // Get the user ID for this record
      const [rows] = await pool.execute(
        'SELECT userId FROM fragment_user_data WHERE id = ?',
        [id]
      );

      if (rows.length === 0) {
        throw new Error('Fragment user data not found');
      }

      const userId = rows[0].userId;

      // Deactivate all other records for this user
      await pool.execute(
        'UPDATE fragment_user_data SET isActive = FALSE WHERE userId = ?',
        [userId]
      );

      // Activate this record
      const [result] = await pool.execute(
        'UPDATE fragment_user_data SET isActive = TRUE WHERE id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        throw new Error('Fragment user data not found');
      }

      return await this.getById(id);
    } catch (error) {
      throw new Error(`Error activating fragment user data: ${error.message}`);
    }
  }

  // Get fragment user data statistics
  static async getStats() {
    try {
      const [totalRows] = await pool.execute('SELECT COUNT(*) as total FROM fragment_user_data');
      const [activeRows] = await pool.execute('SELECT COUNT(*) as active FROM fragment_user_data WHERE isActive = TRUE');
      const [userStats] = await pool.execute(`
        SELECT u.userName, COUNT(*) as dataCount 
        FROM fragment_user_data fud 
        JOIN users u ON fud.userId = u.id 
        GROUP BY fud.userId, u.userName
        ORDER BY dataCount DESC
      `);

      return {
        total: totalRows[0].total,
        active: activeRows[0].active,
        userStats
      };
    } catch (error) {
      throw new Error(`Error fetching fragment user data stats: ${error.message}`);
    }
  }

  // Get cookies data for a user
  static async getCookiesData(userId) {
    try {
      const fragmentData = await this.getActiveByUserId(userId);
      if (!fragmentData) {
        return null;
      }

      return {
        stel_ssid: fragmentData.stelSsid,
        stel_dt: fragmentData.stelDt,
        stel_ton_token: fragmentData.stelTonToken,
        stel_token: fragmentData.stelToken,
        cf_clearance: fragmentData.cfClearance
      };
    } catch (error) {
      throw new Error(`Error getting cookies data: ${error.message}`);
    }
  }

  // Get fragment wallet data for a user
  static async getFragmentWalletData(userId) {
    try {
      const fragmentData = await this.getActiveByUserId(userId);
      if (!fragmentData) {
        return null;
      }

      return {
        fragmentHash: fragmentData.fragmentHash,
        fragmentPublicKey: fragmentData.fragmentPublicKey,
        fragmentWallets: fragmentData.fragmentWallets,
        fragmentAddress: fragmentData.fragmentAddress
      };
    } catch (error) {
      throw new Error(`Error getting fragment wallet data: ${error.message}`);
    }
  }
}

module.exports = FragmentUserData; 