const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');

// Middleware to validate subscription data
const validateSubscriptionData = (req, res, next) => {
  const { selectedUser, selectedAPI, selectedSubscribe } = req.body;
  
  if (!selectedUser || !selectedAPI || !selectedSubscribe) {
    return res.status(400).json({
      success: false,
      message: 'کاربر، نوع API و نوع اشتراک الزامی است'
    });
  }

  const validAPIs = ['Fragment', 'Item2', 'Item3'];
  const validSubscribes = ['Trial', '1 Month', '3 Month', '1 Year'];

  if (!validAPIs.includes(selectedAPI)) {
    return res.status(400).json({
      success: false,
      message: 'نوع API نامعتبر است'
    });
  }

  if (!validSubscribes.includes(selectedSubscribe)) {
    return res.status(400).json({
      success: false,
      message: 'نوع اشتراک نامعتبر است'
    });
  }

  next();
};

// Get all subscriptions
router.get('/', async (req, res) => {
  try {
    const subscriptions = await Subscription.getAll();
    res.json({
      success: true,
      data: subscriptions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get subscription by ID
router.get('/:id', async (req, res) => {
  try {
    const subscriptionId = parseInt(req.params.id);
    const subscription = await Subscription.getById(subscriptionId);
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'اشتراک یافت نشد'
      });
    }

    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get subscriptions by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const subscriptions = await Subscription.getByUserId(userId);
    
    res.json({
      success: true,
      data: subscriptions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create new subscription
router.post('/', validateSubscriptionData, async (req, res) => {
  try {
    const { selectedUser, selectedAPI, selectedSubscribe } = req.body;
    
    const newSubscription = await Subscription.create({
      selectedUser,
      selectedAPI,
      selectedSubscribe
    });
    
    res.status(201).json({
      success: true,
      message: 'اشتراک با موفقیت ایجاد شد',
      data: newSubscription
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Update subscription
router.put('/:id', async (req, res) => {
  try {
    const subscriptionId = parseInt(req.params.id);
    const updateData = req.body;
    
    const updatedSubscription = await Subscription.update(subscriptionId, updateData);
    
    res.json({
      success: true,
      message: 'اشتراک با موفقیت بروزرسانی شد',
      data: updatedSubscription
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Delete subscription
router.delete('/:id', async (req, res) => {
  try {
    const subscriptionId = parseInt(req.params.id);
    await Subscription.delete(subscriptionId);
    
    res.json({
      success: true,
      message: 'اشتراک با موفقیت حذف شد'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Revoke API key
router.patch('/:id/revoke', async (req, res) => {
  try {
    const subscriptionId = parseInt(req.params.id);
    const revokedSubscription = await Subscription.revoke(subscriptionId);
    
    res.json({
      success: true,
      message: 'کلید API با موفقیت لغو شد',
      data: revokedSubscription
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Regenerate API key
router.patch('/:id/regenerate', async (req, res) => {
  try {
    const subscriptionId = parseInt(req.params.id);
    const updatedSubscription = await Subscription.regenerateApiKey(subscriptionId);
    
    res.json({
      success: true,
      message: 'کلید API با موفقیت بازسازی شد',
      data: updatedSubscription
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Validate API key
router.post('/validate', async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'کلید API الزامی است'
      });
    }

    const isValid = await Subscription.isValidApiKey(apiKey);
    
    if (isValid) {
      const subscription = await Subscription.getByApiKey(apiKey);
      res.json({
        success: true,
        message: 'کلید API معتبر است',
        data: {
          isValid: true,
          subscription: {
            id: subscription.id,
            selectedUser: subscription.selectedUser,
            selectedAPI: subscription.selectedAPI,
            selectedSubscribe: subscription.selectedSubscribe,
            userName: subscription.userName,
            dateCreated: subscription.dateCreated
          }
        }
      });
    } else {
      res.json({
        success: false,
        message: 'کلید API نامعتبر است',
        data: {
          isValid: false
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get subscription statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await Subscription.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router; 