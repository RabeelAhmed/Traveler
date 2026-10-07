const mongoose = require('mongoose');
module.exports = (req, res, next, value) => {
  if (!/^[a-fA-F0-9]{24}$/.test(value) || !mongoose.isValidObjectId(value)) return res.status(400).json({ status: 'error', statusCode: 400, message: 'Invalid ID' });
  next();
};
