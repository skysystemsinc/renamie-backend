// Vercel API handler
// This file will be copied to dist/api/index.js during build
// The import will be resolved from the dist folder structure

// Use require for runtime import to avoid TypeScript compilation issues
module.exports = async function handler(req, res) {
  try {
    // Dynamic require of the compiled main.js
    const mainHandler = require('../main.js').default;
    return mainHandler(req, res);
  } catch (error) {
    console.error('Error importing main handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
