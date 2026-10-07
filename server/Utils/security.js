const crypto = require('crypto');
const PUBLIC_USER_FIELDS = 'username fullname profilePicture bio koFiUrl followers following badges verified createdAt';
const hashResetToken = token => crypto.createHash('sha256').update(token).digest('hex');
const validPassword = value => typeof value === 'string' && value.length >= 8 && Buffer.byteLength(value, 'utf8') <= 72;
const validCoordinates = (lat, lng) => Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const collectionCacheKey = (owner, viewer) => `v2:collections:${owner}:${String(owner) === String(viewer) ? 'owner' : 'public'}`;
const profileCacheKey = (owner, viewer) => `v2:profile:${owner}:${viewer}`;
module.exports = { PUBLIC_USER_FIELDS, hashResetToken, validPassword, validCoordinates, escapeRegex, collectionCacheKey, profileCacheKey };
