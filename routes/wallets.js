const express = require('express');
const router = express.Router();
const Wallet = require('../models/Wallet');

// Get all wallets
router.get('/', async (req, res) => {
  try {
    const wallets = await Wallet.getAll();
    res.json({
      success: true,
      message: 'لیست ولت‌ها با موفقیت دریافت شد',
      data: wallets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `خطا در دریافت ولت‌ها: ${error.message}`
    });
  }
});

// Get wallet by ID
router.get('/:id', async (req, res) => {
  try {
    const wallet = await Wallet.getById(req.params.id);
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'ولت یافت نشد'
      });
    }
    res.json({
      success: true,
      message: 'ولت با موفقیت دریافت شد',
      data: wallet
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `خطا در دریافت ولت: ${error.message}`
    });
  }
});

// Get wallets by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const wallets = await Wallet.getByUserId(req.params.userId);
    res.json({
      success: true,
      message: 'لیست ولت‌های کاربر با موفقیت دریافت شد',
      data: wallets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `خطا در دریافت ولت‌های کاربر: ${error.message}`
    });
  }
});

// Get wallets by subscription ID
router.get('/subscription/:subscriptionId', async (req, res) => {
  try {
    const wallets = await Wallet.getBySubscriptionId(req.params.subscriptionId);
    res.json({
      success: true,
      message: 'لیست ولت‌های اشتراک با موفقیت دریافت شد',
      data: wallets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `خطا در دریافت ولت‌های اشتراک: ${error.message}`
    });
  }
});

// Get wallet by address
router.get('/address/:address', async (req, res) => {
  try {
    const wallet = await Wallet.getByAddress(req.params.address);
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'ولت با این آدرس یافت نشد'
      });
    }
    res.json({
      success: true,
      message: 'ولت با موفقیت دریافت شد',
      data: wallet
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `خطا در دریافت ولت: ${error.message}`
    });
  }
});

// Create new wallet
router.post('/', async (req, res) => {
  try {
    const { subscriptionId, userId, walletAddress, mnemonics, publicKey, privateKey, workchain, version } = req.body;
    
    if (!subscriptionId || !userId || !walletAddress || !mnemonics || !publicKey || !privateKey) {
      return res.status(400).json({
        success: false,
        message: 'تمام فیلدهای ضروری باید پر شوند'
      });
    }

    const wallet = await Wallet.create({
      subscriptionId,
      userId,
      walletAddress,
      mnemonics,
      publicKey,
      privateKey,
      workchain,
      version
    });

    res.status(201).json({
      success: true,
      message: 'ولت با موفقیت ایجاد شد',
      data: wallet
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `خطا در ایجاد ولت: ${error.message}`
    });
  }
});

// Update wallet
router.put('/:id', async (req, res) => {
  try {
    const { walletAddress, mnemonics, publicKey, privateKey, workchain, version } = req.body;
    
    const wallet = await Wallet.update(req.params.id, {
      walletAddress,
      mnemonics,
      publicKey,
      privateKey,
      workchain,
      version
    });

    res.json({
      success: true,
      message: 'ولت با موفقیت بروزرسانی شد',
      data: wallet
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `خطا در بروزرسانی ولت: ${error.message}`
    });
  }
});

// Delete wallet
router.delete('/:id', async (req, res) => {
  try {
    await Wallet.delete(req.params.id);
    res.json({
      success: true,
      message: 'ولت با موفقیت حذف شد'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `خطا در حذف ولت: ${error.message}`
    });
  }
});

// Get wallet statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await Wallet.getStats();
    res.json({
      success: true,
      message: 'آمار ولت‌ها با موفقیت دریافت شد',
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