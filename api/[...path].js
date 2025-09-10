// Vercel API handler for all routes
// This file will be copied to dist/api/[...path].js during build

let cachedHandler = null;

// Use require for runtime import to avoid TypeScript compilation issues
module.exports = async function handler(req, res) {
  try {
    // Cache the handler to avoid re-importing on every request
    if (!cachedHandler) {
      console.log('Loading main handler...');
      const mainModule = require('../main.js');
      cachedHandler = mainModule.default || mainModule;
      console.log('Main handler loaded successfully');
    }
    
    return cachedHandler(req, res);
  } catch (error) {
    console.error('Error in Vercel handler:', error);
    console.error('Error stack:', error.stack);
    
    // Return a proper error response
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
};
