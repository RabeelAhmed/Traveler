const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const signMedia = (media, owner, scope) => jwt.sign({ kind: 'media', owner: String(owner), scope, publicId: media.publicId, resourceType: media.resourceType, urlHash: digest(media.url) }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
const verifyMedia = (media, owner, scope) => {
  try {
    const receipt = jwt.verify(media.receipt, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    return receipt.kind === 'media' && receipt.owner === String(owner) && receipt.scope === scope && receipt.publicId === media.publicId && receipt.resourceType === media.resourceType && receipt.urlHash === digest(media.url);
  } catch { return false; }
};
const verifyMediaList = (media, owner) => Array.isArray(media) && media.length > 0 && media.length <= 8 && media.every(item => item && verifyMedia(item, owner, 'post'));
module.exports = { signMedia, verifyMedia, verifyMediaList };
