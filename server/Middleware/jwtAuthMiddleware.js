const jwt = require('jsonwebtoken');
const User = require('../Models/User');
const { error } = require('../Utils/responseWrapper');
const authenticateToken = async token => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.SECRET_KEY, { algorithms: ['HS256'] });
  if (!decoded.exp || !decoded.user_Id) throw new Error('Please sign in again');
  const account = await User.findById(decoded.user_Id).select('+tokenVersion username profilePicture');
  if (!account || (decoded.tokenVersion || 0) !== (account.tokenVersion || 0)) throw new Error('Session revoked');
  return { ...decoded, account };
};
const bearerToken = req => /^Bearer ([^\s]+)$/.exec(req.headers.authorization || '')?.[1];
const verifyAuthToken = async (req, res, next) => {
  try {
    const token = bearerToken(req);
    if (!token) return res.status(401).json(error(401, 'Authorization header is required'));
    req.user = await authenticateToken(token);
    next();
  } catch {
    return res.status(401).json(error(401, 'Session expired or invalid. Please sign in again.'));
  }
};
const optionalAuthToken = async (req, res, next) => {
  req.user = null;
  try { if (bearerToken(req)) req.user = await authenticateToken(bearerToken(req)); } catch { /* Continue as guest. */ }
  next();
};
const signjwt = (user_Id, tokenVersion = 0) => jwt.sign(
  { user_Id, tokenVersion }, process.env.JWT_SECRET || process.env.SECRET_KEY,
  { algorithm: 'HS256', expiresIn: '24h' }
);
module.exports = { signjwt, verifyAuthToken, optionalAuthToken, authenticateToken };
