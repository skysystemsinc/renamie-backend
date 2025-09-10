// Vercel API handler
// This file will be copied to dist/api/index.js during build
// The import will be resolved from the dist folder structure

let cachedHandler = null;

// Use require for runtime import to avoid TypeScript compilation issues
module.exports = async function handler(req, res) {
  try {
    console.log(`Vercel handler called: ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    
    // Cache the handler to avoid re-importing on every request
    if (!cachedHandler) {
      console.log('Loading main handler...');
      const mainModule = require('../main');
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
