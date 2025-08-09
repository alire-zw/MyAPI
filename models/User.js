const pool = require('../database/connection');
const bcrypt = require('bcryptjs');

class User {
  // Get all users
  static async getAll() {
    try {
      const [rows] = await pool.execute(
        'SELECT id, userName, isBanned, dateJoined FROM users ORDER BY dateJoined DESC'
      );
      return rows;
    } catch (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }
  }

  // Get user by ID
  static async getById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT id, userName, isBanned, dateJoined FROM users WHERE id = ?',
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error fetching user: ${error.message}`);
    }
  }

  // Get user by username
  static async getByUsername(userName) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM users WHERE userName = ?',
        [userName]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error fetching user by username: ${error.message}`);
    }
  }

  // Create new user
  static async create(userData) {
    try {
      const { userName, userPassword } = userData;
      
      // Check if user already exists
      const existingUser = await this.getByUsername(userName);
      if (existingUser) {
        throw new Error('Username already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userPassword, 10);

      const [result] = await pool.execute(
        'INSERT INTO users (userName, userPassword) VALUES (?, ?)',
        [userName, hashedPassword]
      );

      return { id: result.insertId, userName, isBanned: false };
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  // Update user
  static async update(id, updateData) {
    try {
      const { userName, userPassword, isBanned } = updateData;
      const updates = [];
      const values = [];

      if (userName !== undefined) {
        updates.push('userName = ?');
        values.push(userName);
      }

      if (userPassword !== undefined) {
        updates.push('userPassword = ?');
        const hashedPassword = await bcrypt.hash(userPassword, 10);
        values.push(hashedPassword);
      }

      if (isBanned !== undefined) {
        updates.push('isBanned = ?');
        values.push(isBanned);
      }

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(id);
      const [result] = await pool.execute(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      if (result.affectedRows === 0) {
        throw new Error('User not found');
      }

      return await this.getById(id);
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  // Delete user
  static async delete(id) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM users WHERE id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        throw new Error('User not found');
      }

      return { message: 'User deleted successfully' };
    } catch (error) {
      throw new Error(`Error deleting user: ${error.message}`);
    }
  }

  // Ban/Unban user
  static async toggleBan(id) {
    try {
      const user = await this.getById(id);
      if (!user) {
        throw new Error('User not found');
      }

      const newBanStatus = !user.isBanned;
      const [result] = await pool.execute(
        'UPDATE users SET isBanned = ? WHERE id = ?',
        [newBanStatus, id]
      );

      return { ...user, isBanned: newBanStatus };
    } catch (error) {
      throw new Error(`Error toggling ban status: ${error.message}`);
    }
  }

  // Verify password
  static async verifyPassword(userName, password) {
    try {
      const user = await this.getByUsername(userName);
      if (!user) {
        return false;
      }

      return await bcrypt.compare(password, user.userPassword);
    } catch (error) {
      throw new Error(`Error verifying password: ${error.message}`);
    }
  }
}

module.exports = User; 