// Vercel entrypoint
const mainHandler = require('../dist/main').default;

module.exports = (req, res) => {
  return mainHandler(req, res);
};
