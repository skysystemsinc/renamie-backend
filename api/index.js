const path = require('path');
let cachedHandler = null;

module.exports = async function handler(req, res) {
  try {
    if (!cachedHandler) {
      console.log('Loading main handler...');
      // ✅ Correct relative path to dist/main.js
      const mainModule = require(path.join(__dirname, '..', 'dist', 'main.js'));
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
