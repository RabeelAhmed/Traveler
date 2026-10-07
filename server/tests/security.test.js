const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const security = require('../Utils/security');
const envelope = require('../Utils/responseWrapper');

function load(file, mocks) {
  const filename = path.join(__dirname, '..', file);
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), { module, exports: module.exports, console, Date, Map, Set, Number, String, Promise, setTimeout, clearTimeout, process, require: name => {
    if (name in mocks) return mocks[name];
    throw new Error('Unexpected dependency: ' + name);
  } }, { filename });
  return module.exports;
}
function response() {
  return { statusCode: 200, status(code) { this.statusCode = code; return this; }, send(body) { this.body = body; return this; }, json(body) { this.body = body; return this; }, set() { return this; } };
}
test('collection lists cannot reuse owner cache for another viewer', async () => {
  const cache = new Map();
  const queries = [];
  const Collection = { find(filter) {
    queries.push(filter);
    const records = [{ isPublic: true, name: 'Public', posts: [] }, ...(filter.isPublic ? [] : [{ isPublic: false, name: 'Private', posts: [] }])];
    return { populate() { return this; }, sort: async () => records.map(record => ({ posts: [], toObject: () => record })) };
  } };
  const controller = load('Controllers/collectionController.js', {
    '../Models/collection': Collection, '../Models/post': {}, '../Utils/security': security,
    '../Utils/responseWrapper': envelope, '../Utils/utils': { mapPostOutput: value => value },
    '../Utils/cache': { TTL: {}, deleteCache: async key => cache.delete(key), remember: async (key, ttl, fn) => { if (!cache.has(key)) cache.set(key, await fn()); return cache.get(key); } },
  });
  for (const viewer of ['owner', 'visitor', 'owner', 'visitor']) {
    const res = response();
    await controller.getUserCollections({ params: { userId: 'owner' }, user: { user_Id: viewer } }, res);
    assert.equal(res.body.result.collections.length, viewer === 'owner' ? 2 : 1);
  }
  assert.equal(queries.length, 2);
});
test('public profile projection excludes sensitive account fields', () => {
  const fields = security.PUBLIC_USER_FIELDS.split(' ');
  for (const field of ['email', 'dateOfBirth', 'password', 'resetPasswordToken', 'resetPasswordExpires', 'tokenVersion']) assert.ok(!fields.includes(field));
  assert.notEqual(security.profileCacheKey('a', 'a'), security.profileCacheKey('a', 'b'));
});
test('password bounds respect bcrypt byte limit and reset tokens are hashed', () => {
  assert.equal(security.validPassword('short'), false);
  assert.equal(security.validPassword('12345678'), true);
  assert.equal(security.validPassword('é'.repeat(37)), false);
  assert.equal(security.hashResetToken('token').length, 64);
  assert.notEqual(security.hashResetToken('token'), 'token');
});
test('coordinates reject nonfinite and out-of-range input; searches are literal', () => {
  assert.equal(security.validCoordinates(0, 0), true);
  for (const coords of [[91, 0], [0, 181], [Infinity, 0], ['0', 0]]) assert.equal(security.validCoordinates(...coords), false);
  const input = '[x].*(foo)+$';
  const regex = new RegExp(security.escapeRegex(input));
  assert.ok(regex.test(input));
  assert.equal(regex.test('xanythingfoo'), false);
});
test('socket-disabled notifications and messaging emits are safe', () => {
  const socket = load('socket.js', {
    './Models/notification': {}, './Models/conversation': {}, './Middleware/jwtAuthMiddleware': {}, './Utils/security': security,
  });
  assert.doesNotThrow(() => socket.emitMessagesRead('user', 'conversation'));
  assert.doesNotThrow(() => socket.emitMessage('user', {}));
  assert.doesNotThrow(() => socket.disconnectUser('user'));
});
test('socket identity comes from authentication; client cannot relay fabricated messages', async () => {
  let middleware, connect;
  const io = { use(fn) { middleware = fn; }, on(event, fn) { connect = fn; } };
  const socket = load('socket.js', {
    './Models/notification': {}, './Models/conversation': {}, './Utils/security': security,
    './Middleware/jwtAuthMiddleware': { authenticateToken: async token => { if (token !== 'valid') throw Error('invalid'); return { user_Id: 'real-user', exp: Date.now() / 1000 + 60, account: {} }; } },
  });
  socket.initsocket(io);
  let rejection;
  await middleware({ data: {}, handshake: { auth: { token: 'invalid' } } }, err => { rejection = err; });
  assert.equal(rejection.message, 'Authentication required');
  const handlers = {}, rooms = [];
  const client = { data: {}, handshake: { auth: { token: 'valid' } }, join: name => rooms.push(name), on: (event, fn) => { handlers[event] = fn; }, disconnect() {} };
  await middleware(client, err => assert.equal(err, undefined));
  connect(client);
  assert.deepEqual(rooms, ['user:real-user']);
  assert.equal(handlers.join, undefined);
  assert.equal(handlers.sendMessage, undefined);
  assert.doesNotThrow(() => handlers.goLive(null));
  assert.doesNotThrow(() => handlers.updateLocation(null));
  io.in = () => ({ fetchSockets: async () => [{}] });
  await handlers.disconnect();
});
test('local rate limiting works without Redis and ignores forged forwarding header', async () => {
  const { createRateLimiter } = load('Middleware/rateLimiter.js', { '../Utils/redis': null });
  const limit = createRateLimiter('test', 1, 60);
  let passed = 0;
  await limit({ ip: 'trusted-ip', headers: { 'x-forwarded-for': 'fake-1' } }, response(), () => passed++);
  const res = response();
  await limit({ ip: 'trusted-ip', headers: { 'x-forwarded-for': 'fake-2' } }, res, () => passed++);
  assert.equal(passed, 1);
  assert.equal(res.statusCode, 429);
});
test('JWTs expire, reject legacy tokens, and stop working after session revocation', async () => {
  process.env.JWT_SECRET = 'test-secret-that-is-only-used-in-the-test-process';
  const jwt = require('jsonwebtoken');
  let version = 2;
  const auth = load('Middleware/jwtAuthMiddleware.js', {
    jsonwebtoken: jwt, '../Utils/responseWrapper': envelope,
    '../Models/User': { findById: () => ({ select: async () => ({ tokenVersion: version }) }) },
  });
  const token = auth.signjwt('user', 2);
  assert.ok(jwt.decode(token).exp > jwt.decode(token).iat);
  assert.equal((await auth.authenticateToken(token)).user_Id, 'user');
  version = 3;
  await assert.rejects(auth.authenticateToken(token), /Session revoked/);
  await assert.rejects(auth.authenticateToken(jwt.sign({ user_Id: 'user' }, process.env.JWT_SECRET)), /sign in again/);
});
test('media receipts reject another owner, modified URLs, and a different media purpose', () => {
  process.env.JWT_SECRET = 'test-secret-that-is-only-used-in-the-test-process';
  const { signMedia, verifyMedia } = require('../Utils/mediaReceipt');
  const media = { publicId: 'traveler/posts/asset', url: 'https://example.test/asset.jpg', resourceType: 'image' };
  media.receipt = signMedia(media, 'owner', 'post');
  assert.equal(verifyMedia(media, 'owner', 'post'), true);
  assert.equal(verifyMedia(media, 'visitor', 'post'), false);
  assert.equal(verifyMedia(media, 'owner', 'story'), false);
  assert.equal(verifyMedia({ ...media, url: 'https://example.test/another.jpg' }, 'owner', 'post'), false);
});
test('message history starts from the latest messages and marks only the returned IDs read', async () => {
  let query, order, readFilter;
  const controller = load('Controllers/messageController.js', {
    '../Models/conversation': { findById: async () => ({ participants: ['viewer', 'other'] }) },
    '../Models/User': {}, mongoose: require('mongoose'), '../Utils/responseWrapper': envelope,
    '../socket': { emitMessagesRead() {}, emitMessage() {} },
    '../Models/message': {
      find(filter) { query = filter; return { sort(value) { order = value; return this; }, skip() { return this; }, limit() { return this; }, populate: async () => [{ _id: 'newer' }, { _id: 'older' }] }; },
      updateMany: async filter => { readFilter = filter; },
    },
  });
  const res = response();
  await controller.getMessages({ params: { conversationId: 'conversation' }, user: { user_Id: 'viewer' }, query: {} }, res);
  assert.equal(query.conversationId, 'conversation');
  assert.equal(order._id, -1);
  assert.equal(res.body.result.messages[0]._id, 'older');
  assert.deepEqual(Array.from(readFilter._id.$in), ['older', 'newer']);
});
test('story cleanup keeps documents when media deletion fails for a later retry', async () => {
  let deleted = false;
  const cleanup = load('Utils/storyCleanup.js', {
    '../Models/story': { find: () => ({ limit: async () => [{ _id: 'story', video: { publicId: 'asset' } }] }), deleteOne: async () => { deleted = true; } },
    '../Models/User': { updateMany() {} }, './cache': { deleteByPattern() {} },
    './cloudinaryConfig': { cloudinary: { uploader: { destroy: async () => { throw Error('temporary failure'); } } } },
  });
  assert.equal((await cleanup.cleanupExpiredStories()).deleted, 0);
  assert.equal(deleted, false);
});
test('upload middleware loads and rejects inconsistent extensions and MIME types', () => {
  assert.ok(require('../Middleware/uploads').profileUpload);
  const { validateFile } = require('../Utils/cloudinaryConfig');
  assert.throws(() => validateFile({ originalname: 'file.exe', mimetype: 'image/jpeg', size: 10 }), /Unsupported/);
  assert.equal(validateFile({ originalname: 'photo.jpg', mimetype: 'image/jpeg', size: 10 }), 'image');
  assert.throws(() => validateFile({ originalname: 'photo.jpg', mimetype: 'image/jpeg', size: 11 * 1024 * 1024 }), /10 MB/);
});
