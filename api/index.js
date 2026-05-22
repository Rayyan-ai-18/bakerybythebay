// Vercel serverless function entry point
// The `api/` directory pattern tells Vercel to auto-deploy this as a Node.js function
// without needing the legacy `builds` config in vercel.json

const app = require('../server');

module.exports = app;
