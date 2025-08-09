const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: './config.env' });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const usersRouter = require('./routes/users');
const subscriptionsRouter = require('./routes/subscriptions');
const walletsRouter = require('./routes/wallets');
const fragmentUserDataRouter = require('./routes/fragmentUserData');

// Routes
app.use('/api/users', usersRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/wallets', walletsRouter);
app.use('/api/fragment-user-data', fragmentUserDataRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Miral Services are UP!',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'خوش آمدید به پلتفرم جامع علیرضا',
    version: '1.0.0',
    services: {
      frontend: {
        url: 'http://localhost:3001',
        description: 'Next.js Frontend Application'
      },
      backend: {
        url: 'http://localhost:3000',
        description: 'Node.js API Server',
        endpoints: {
          health: '/health',
          users: '/api/users',
          register: '/api/users/register',
          login: '/api/users/login',
          subscriptions: '/api/subscriptions',
          wallets: '/api/wallets',
          fragmentUserData: '/api/fragment-user-data'
        }
      },
      fragmentAPI: {
        url: 'http://localhost:3003',
        description: 'Python Fragment API Service',
        endpoints: {
          info: '/',
          walletGenerate: '/api/wallet/generate',
          walletInfo: '/api/wallet/info',
          starsBuy: '/api/stars/buy'
        }
      }
    },
    usage: {
      startAll: 'npm run dev:full',
      startBackend: 'npm run dev',
      startFrontend: 'npm run dev:frontend', 
      startPython: 'npm run dev:python'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'مسیر یافت نشد'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'خطای داخلی سرور'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

module.exports = app; 