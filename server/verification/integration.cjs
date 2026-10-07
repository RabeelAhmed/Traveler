// Disposable local replica set. No external database, email, Redis or media writes.
const assert = require('node:assert/strict');
const path = require('node:path');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const mongoose = require('../node_modules/mongoose');
const jwt = require('../node_modules/jsonwebtoken');
let replica, server;
const checks = [];
const base = 'http://127.0.0.1:5055';
async function request(route, { method = 'GET', token, body, status = 200 } = {}) {
  const result = await fetch(base + route, { method, headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000) });
  const data = await result.json();
  assert.equal(result.status, status, route + ': ' + JSON.stringify(data));
  return data;
}
async function check(name, work) { await work(); checks.push(name); console.log('PASS:', name); }
(async () => {
  try {
    process.env.MONGOMS_DOWNLOAD_DIR = path.join(__dirname, '.cache');
    replica = await MongoMemoryReplSet.create({ replSet: { count: 1 }, binary: { version: '7.0.14' } });
    Object.assign(process.env, { NODE_ENV: 'production', VERCEL: '1', URI: replica.getUri('traveler_verification'), MONGO_URI: replica.getUri('traveler_verification'), JWT_SECRET: 'isolated-verification-secret-only', CLOUDINARY_CLOUD_NAME: 'dummy', CLOUDINARY_API_KEY: 'dummy', CLOUDINARY_API_SECRET: 'dummy', RESEND_API_KEY: 're_isolated_test_key', ORIGIN: 'http://localhost:5173', CRON_SECRET: 'isolated-cron-secret', KV_REST_API_URL: '', KV_REST_API_TOKEN: '', UPSTASH_REDIS_REST_URL: '', UPSTASH_REDIS_REST_TOKEN: '' });
    const { app } = require('../app');
    await mongoose.connection.asPromise();
    for (const file of require('node:fs').readdirSync(path.join(__dirname, '../Models')).filter(file => file.endsWith('.js'))) await require('../Models/' + file).createIndexes();
    server = app.listen(5055, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    await check('API starts with production/serverless configuration', () => request('/health'));
    let owner, visitor, ownerId, visitorId;
    await check('signup, login and expiring authentication', async () => {
      for (const name of ['owner', 'visitor']) {
        const data = await request('/auth/signup', { method: 'POST', body: { username: name, fullname: 'Test ' + name, email: name + '@example.test', password: 'Verification123!', dateOfBirth: '2000-01-01', bio: 'Disposable integration test' } });
        const profile = await request('/auth/profile', { token: data.result });
        if (name === 'owner') { owner = data.result; ownerId = profile.data.userProfile._id; } else { visitor = data.result; visitorId = profile.data.userProfile._id; }
        assert.ok(jwt.decode(data.result).exp);
      }
      await request('/auth/login', { method: 'POST', body: { email: 'owner@example.test', password: 'Verification123!' } });
      await request('/auth/profile', { status: 401 });
    });
    await check('public profiles do not expose account fields', async () => {
      const data = await request('/user/getuserprofile/' + ownerId, { token: visitor });
      for (const key of ['email', 'password', 'dateOfBirth', 'resetPasswordToken', 'tokenVersion']) assert.equal(data.data.userProfile[key], undefined);
    });
    await check('private collection lists, detail and ownership are enforced', async () => {
      const privateCollection = await request('/collection', { method: 'POST', token: owner, body: { name: 'Private', isPublic: false }, status: 201 });
      await request('/collection', { method: 'POST', token: owner, body: { name: 'Public', isPublic: true }, status: 201 });
      assert.equal((await request('/collection/user/' + ownerId, { token: owner })).result.collections.length, 2);
      assert.equal((await request('/collection/user/' + ownerId, { token: visitor })).result.collections.length, 1);
      await request('/collection/' + privateCollection.result.collection._id, { token: visitor, status: 403 });
      await request('/collection/' + privateCollection.result.collection._id, { method: 'PUT', token: visitor, body: { name: 'Unauthorized' }, status: 403 });
      await request('/collection/not-an-id', { token: owner, status: 400 });
    });
    const { signMedia } = require('../Utils/mediaReceipt');
    const mediaFor = user => { const media = { url: 'https://example.test/image.jpg', publicId: 'test-' + user, resourceType: 'image' }; return { ...media, receipt: signMedia(media, user, 'post') }; };
    let postId;
    await check('signed media ownership and per-viewer like flags', async () => {
      const body = { title: 'Test trip', description: 'Verification post', location: 'Lahore', rating: 5, hashtags: ['#test'], media: [mediaFor(ownerId)] };
      postId = (await request('/post/createpost', { method: 'POST', token: owner, body, status: 201 })).result.newPost._id;
      await request('/post/createpost', { method: 'POST', token: visitor, body, status: 400 });
      await request('/post/likepost', { method: 'POST', token: visitor, body: { postId } });
      assert.equal((await request('/post/' + postId, { token: visitor })).result.post.isLikedByUser, true);
      assert.equal((await request('/post/' + postId, { token: owner })).result.post.isLikedByUser, false);
    });
    await check('follow transactions update both sides', async () => {
      await request('/user/follow', { method: 'POST', token: visitor, body: { followId: ownerId } });
      const User = require('../Models/User');
      assert.ok((await User.findById(visitorId)).following.some(id => String(id) === ownerId));
      assert.ok((await User.findById(ownerId)).followers.some(id => String(id) === visitorId));
    });
    await check('collaborative journey transactions preserve concurrent step order', async () => {
      const journey = (await request('/journey/start', { method: 'POST', token: owner, body: { title: 'Test journey', description: 'First stop', location: 'Lahore', media: [mediaFor(ownerId)] }, status: 201 })).result.journey;
      await request('/journey/' + journey._id + '/addstep', { method: 'POST', token: visitor, body: { description: 'Not invited', location: 'Karachi', media: [mediaFor(visitorId)] }, status: 403 });
      await request('/journey/' + journey._id + '/invite', { method: 'POST', token: owner, body: { userId: visitorId } });
      await request('/journey/' + journey._id + '/invite/respond', { method: 'POST', token: visitor, body: { accept: true } });
      await Promise.all([owner, visitor].map((token, index) => request('/journey/' + journey._id + '/addstep', { method: 'POST', token, body: { description: 'Concurrent stop ' + index, location: 'Karachi', media: [mediaFor(index ? visitorId : ownerId)] }, status: 201 })));
      const stored = await require('../Models/journey').findById(journey._id).populate('steps');
      assert.equal(stored.steps.length, 3);
      assert.deepEqual(stored.steps.map(post => post.stepIndex), [0, 1, 2]);
    });
    await check('conversations deduplicate; latest history and access checks work', async () => {
      const attempts = await Promise.all([1, 2].map(() => request('/message/conversation', { method: 'POST', token: owner, body: { otherUserId: visitorId } })));
      const id = attempts[0].result.conversation._id;
      assert.equal(id, attempts[1].result.conversation._id);
      const Message = require('../Models/message');
      await Message.insertMany(Array.from({ length: 35 }, (_, index) => ({ conversationId: id, sender: ownerId, text: 'Message ' + index })));
      const latest = (await request('/message/' + id, { token: visitor })).result;
      assert.equal(latest.messages.length, 30);
      assert.equal(latest.messages[29].text, 'Message 34');
      const older = (await request('/message/' + id + '?before=' + latest.messages[0]._id, { token: visitor })).result;
      assert.equal(older.messages.length, 5);
      await request('/message/' + id, { method: 'POST', token: owner, body: { text: 'REST message with sockets disabled' }, status: 201 });
      await request('/message/' + id + '?page=-1', { token: visitor, status: 400 });
    });
    await check('expired stories are hidden and cleanup requires its secret', async () => {
      const Story = require('../Models/story');
      await Story.create({ title: 'Expired', video: { url: 'https://example.test/old.jpg', resourceType: 'image' }, location: { latitude: 0, longitude: 0 }, userId: ownerId, createdAt: new Date(Date.now() - 90000000) });
      assert.equal((await request('/story/getstory', { token: owner, status: 201 })).result.stories.length, 0);
      await request('/internal/cleanup-stories', { status: 401 });
      assert.equal((await request('/internal/cleanup-stories', { token: process.env.CRON_SECRET })).deleted, 1);
    });
    await check('password reset atomically revokes prior sessions', async () => {
      const { hashResetToken } = require('../Utils/security');
      const reset = 'a'.repeat(40);
      await require('../Models/User').updateOne({ _id: ownerId }, { $set: { resetPasswordToken: hashResetToken(reset), resetPasswordExpires: new Date(Date.now() + 60000) } });
      await request('/auth/reset-password', { method: 'POST', body: { token: reset, newPassword: 'VerificationReset123!' } });
      await request('/auth/profile', { token: owner, status: 401 });
      await request('/auth/reset-password', { method: 'POST', body: { token: reset, newPassword: 'VerificationReset123!' }, status: 400 });
      const login = await request('/auth/login', { method: 'POST', body: { email: 'owner@example.test', password: 'VerificationReset123!' } });
      await request('/auth/profile', { token: login.result.token });
    });
    console.log('INTEGRATION RESULT: ' + checks.length + ' flows passed');
  } catch (err) { console.error('INTEGRATION FAILED:', err.message); process.exitCode = 1; }
  finally {
    if (server) await new Promise(resolve => server.close(resolve));
    await mongoose.disconnect();
    if (replica) await replica.stop();
  }
})();
