// Vercel API handler
// This file will be copied to dist/api/index.js during build

let cachedHandler = null;

module.exports = async function handler(req, res) {
  try {
    console.log(`Vercel handler called: ${req.method} ${req.url}`);

    if (!cachedHandler) {
      console.log('Loading main handler...');
      // IMPORTANT: point to dist/main.js relative to dist/api/index.js
      const mainModule = require('../main'); 
      cachedHandler = mainModule.default || mainModule;
      console.log('Main handler loaded successfully');
    }

    return cachedHandler(req, res);
  } catch (error) {
    console.error('Error in Vercel handler:', error);

    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
};
