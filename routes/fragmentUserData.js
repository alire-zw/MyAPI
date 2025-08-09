const express = require('express');
const router = express.Router();
const FragmentUserData = require('../models/FragmentUserData');

// Get all fragment user data
router.get('/', async (req, res) => {
  try {
    const fragmentData = await FragmentUserData.getAll();
    res.json({
      success: true,
      message: 'لیست اطلاعات Fragment کاربران با موفقیت دریافت شد',
      data: fragmentData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `خطا در دریافت اطلاعات Fragment: ${error.message}`
    });
  }
});

// Get fragment user data by ID
router.get('/:id', async (req, res) => {
  try {
    const fragmentData = await FragmentUserData.getById(req.params.id);
    if (!fragmentData) {
      return res.status(404).json({
        success: false,
        message: 'اطلاعات Fragment یافت نشد'
      });
    }
    res.json({
      success: true,
      message: 'اطلاعات Fragment با موفقیت دریافت شد',
      data: fragmentData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `خطا در دریافت اطلاعات Fragment: ${error.message}`
    });
  }
});

// Get fragment user data by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const fragmentData = await FragmentUserData.getByUserId(req.params.userId);
    res.json({
      success: true,
      message: 'لیست اطلاعات Fragment کاربر با موفقیت دریافت شد',
      data: fragmentData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `خطا در دریافت اطلاعات Fragment کاربر: ${error.message}`
    });
  }
});

// Get active fragment user data by user ID
router.get('/user/:userId/active', async (req, res) => {
  try {
    const fragmentData = await FragmentUserData.getActiveByUserId(req.params.userId);
    if (!fragmentData) {
      return res.status(404).json({
        success: false,
        message: 'اطلاعات Fragment فعال برای این کاربر یافت نشد'
      });
    }
    res.json({
      success: true,
      message: 'اطلاعات Fragment فعال با موفقیت دریافت شد',
      data: fragmentData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `خطا در دریافت اطلاعات Fragment فعال: ${error.message}`
    });
  }
});

// Get fragment user data by fragment hash
router.get('/hash/:fragmentHash', async (req, res) => {
  try {
    const fragmentData = await FragmentUserData.getByFragmentHash(req.params.fragmentHash);
    if (!fragmentData) {
      return res.status(404).json({
        success: false,
        message: 'اطلاعات Fragment با این هش یافت نشد'
      });
    }
    res.json({
      success: true,
      message: 'اطلاعات Fragment با موفقیت دریافت شد',
      data: fragmentData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `خطا در دریافت اطلاعات Fragment: ${error.message}`
    });
  }
});

// Create new fragment user data
router.post('/', async (req, res) => {
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
      stelToken
    } = req.body;
    
    if (!userId || !fragmentHash || !fragmentPublicKey || !fragmentWallets || !fragmentAddress || !stelSsid || !stelDt || !stelTonToken || !stelToken) {
      return res.status(400).json({
        success: false,
        message: 'تمام فیلدهای ضروری باید پر شوند'
      });
    }

    const fragmentData = await FragmentUserData.create({
      userId,
      fragmentHash,
      fragmentPublicKey,
      fragmentWallets,
      fragmentAddress,
      stelSsid,
      stelDt,
      stelTonToken,
      stelToken
    });

    res.status(201).json({
      success: true,
      message: 'اطلاعات Fragment با موفقیت ایجاد شد',
      data: fragmentData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `خطا در ایجاد اطلاعات Fragment: ${error.message}`
    });
  }
});

// Update fragment user data
router.put('/:id', async (req, res) => {
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
      isActive
    } = req.body;
    
    const fragmentData = await FragmentUserData.update(req.params.id, {
      fragmentHash,
      fragmentPublicKey,
      fragmentWallets,
      fragmentAddress,
      stelSsid,
      stelDt,
      stelTonToken,
      stelToken,
      isActive
    });

    res.json({
      success: true,
      message: 'اطلاعات Fragment با موفقیت بروزرسانی شد',
      data: fragmentData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `خطا در بروزرسانی اطلاعات Fragment: ${error.message}`
    });
  }
});

// Delete fragment user data
router.delete('/:id', async (req, res) => {
  try {
    await FragmentUserData.delete(req.params.id);
    res.json({
      success: true,
      message: 'اطلاعات Fragment با موفقیت حذف شد'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `خطا در حذف اطلاعات Fragment: ${error.message}`
    });
  }
});

// Activate fragment user data
router.patch('/:id/activate', async (req, res) => {
  try {
    const fragmentData = await FragmentUserData.activate(req.params.id);
    res.json({
      success: true,
      message: 'اطلاعات Fragment با موفقیت فعال شد',
      data: fragmentData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `خطا در فعال‌سازی اطلاعات Fragment: ${error.message}`
    });
  }
});

// Get cookies data for a user
router.get('/user/:userId/cookies', async (req, res) => {
  try {
    const cookiesData = await FragmentUserData.getCookiesData(req.params.userId);
    if (!cookiesData) {
      return res.status(404).json({
        success: false,
        message: 'اطلاعات کوکی برای این کاربر یافت نشد'
      });
    }
    res.json({
      success: true,
      message: 'اطلاعات کوکی با موفقیت دریافت شد',
      data: cookiesData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `خطا در دریافت اطلاعات کوکی: ${error.message}`
    });
  }
});

// Get fragment wallet data for a user
router.get('/user/:userId/wallet', async (req, res) => {
  try {
    const walletData = await FragmentUserData.getFragmentWalletData(req.params.userId);
    if (!walletData) {
      return res.status(404).json({
        success: false,
        message: 'اطلاعات کیف پول Fragment برای این کاربر یافت نشد'
      });
    }
    res.json({
      success: true,
      message: 'اطلاعات کیف پول Fragment با موفقیت دریافت شد',
      data: walletData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `خطا در دریافت اطلاعات کیف پول Fragment: ${error.message}`
    });
  }
});

// Get fragment user data statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await FragmentUserData.getStats();
    res.json({
      success: true,
      message: 'آمار اطلاعات Fragment با موفقیت دریافت شد',
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `خطا در دریافت آمار: ${error.message}`
    });
  }
});

module.exports = router; 