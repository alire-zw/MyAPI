const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware to validate user data
const validateUserData = (req, res, next) => {
  const { userName, userPassword } = req.body;
  
  if (!userName || !userPassword) {
    return res.status(400).json({
      success: false,
      message: 'نام کاربری و رمز عبور الزامی است'
    });
  }

  if (userName.length < 3) {
    return res.status(400).json({
      success: false,
      message: 'نام کاربری باید حداقل ۳ کاراکتر باشد'
    });
  }

  if (userPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'رمز عبور باید حداقل ۶ کاراکتر باشد'
    });
  }

  next();
};

// Register new user
router.post('/register', validateUserData, async (req, res) => {
  try {
    const { userName, userPassword } = req.body;
    
    const newUser = await User.create({ userName, userPassword });
    
    res.status(201).json({
      success: true,
      message: 'کاربر با موفقیت ثبت شد',
      data: {
        id: newUser.id,
        userName: newUser.userName,
        isBanned: newUser.isBanned
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { userName, userPassword } = req.body;
    
    if (!userName || !userPassword) {
      return res.status(400).json({
        success: false,
        message: 'نام کاربری و رمز عبور الزامی است'
      });
    }

    const user = await User.getByUsername(userName);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'نام کاربری یا رمز عبور اشتباه است'
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'حساب کاربری شما مسدود شده است'
      });
    }

    const isValidPassword = await User.verifyPassword(userName, userPassword);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'نام کاربری یا رمز عبور اشتباه است'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, userName: user.userName },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'ورود موفقیت‌آمیز',
      data: {
        token,
        user: {
          id: user.id,
          userName: user.userName,
          isBanned: user.isBanned,
          dateJoined: user.dateJoined
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطا در ورود به سیستم'
    });
  }
});

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.getAll();
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await User.getById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'کاربر یافت نشد'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const updateData = req.body;
    
    const updatedUser = await User.update(userId, updateData);
    
    res.json({
      success: true,
      message: 'اطلاعات کاربر با موفقیت بروزرسانی شد',
      data: updatedUser
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    await User.delete(userId);
    
    res.json({
      success: true,
      message: 'کاربر با موفقیت حذف شد'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Toggle ban status
router.patch('/:id/ban', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const updatedUser = await User.toggleBan(userId);
    
    const message = updatedUser.isBanned ? 'کاربر مسدود شد' : 'مسدودیت کاربر برداشته شد';
    
    res.json({
      success: true,
      message,
      data: updatedUser
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router; 