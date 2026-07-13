// Vercel serverless entry point.
// Vercel looks for api/index.js and calls the exported Express app
// as a standard Node.js HTTP handler (req, res).
const { app } = require('../app');

module.exports = app;
