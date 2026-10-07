const Collection = require('../Models/collection');
const Post = require('../Models/post');
const { collectionCacheKey } = require('../Utils/security');
const invalidateCollections = owner => Promise.all(['owner', 'public'].map(scope => deleteCache(`v2:collections:${owner}:${scope}`)));
const { success, error } = require('../Utils/responseWrapper');
const { mapPostOutput } = require('../Utils/utils');
const { remember, deleteCache, TTL } = require('../Utils/cache');

// POST /collection
const createCollection = async (req, res) => {
  try {
    const { name, description, isPublic } = req.body;
    const curUserId = req.user.user_Id;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).send(error(400, 'Collection name is required'));
    }

    if ((description !== undefined && typeof description !== "string") || (isPublic !== undefined && typeof isPublic !== "boolean")) return res.status(400).json(error(400, "Invalid collection fields"));
    const collection = await Collection.create({
      owner: curUserId,
      name: name.trim(),
      description: description?.trim(),
      isPublic: isPublic !== undefined ? isPublic : true,
    });

    // ── Cache Invalidation ──────────────────────────────────────────────────
    await invalidateCollections(curUserId);

    return res.send(success(201, { collection }));
  } catch (err) {
    console.error('createCollection error:', err);
    return res.status(500).send(error(500, 'Something went wrong'));
  }
};

// GET /collection/user/:userId
const getUserCollections = async (req, res) => {
  try {
    const { userId } = req.params;
    const curUserId = req.user.user_Id;

    const cacheKey = collectionCacheKey(userId, curUserId);
    const collections = await remember(cacheKey, TTL.COLLECTIONS, async () => {
      // Own collections → all; other user → public only
      const filter =
        userId === curUserId
          ? { owner: userId }
          : { owner: userId, isPublic: true };

      const rawCollections = await Collection.find(filter)
        .populate({ path: 'posts', select: 'media' })
        .sort({ createdAt: -1 });

      return rawCollections.map((col) => {
        const colObj = col.toObject();
        colObj.coverImages = col.posts
          .slice(0, 4)
          .map((p) => p?.media?.[0]?.url)
          .filter(Boolean);
        colObj.postCount = col.posts.length;
        colObj.posts = col.posts.map((p) => p._id);
        return colObj;
      });
    });

    return res.send(success(200, { collections }));
  } catch (err) {
    console.error('getUserCollections error:', err);
    return res.status(500).send(error(500, 'Something went wrong'));
  }
};

// GET /collection/:id
const getCollectionById = async (req, res) => {
  try {
    const { id } = req.params;
    const curUserId = req.user.user_Id;

    const collection = await Collection.findById(id).populate({
      path: 'posts',
      populate: [
        { path: 'userId' },
        {
          path: 'comments',
          populate: { path: 'userId', select: 'fullname profilePicture' },
        },
      ],
    });

    if (!collection) {
      return res.status(404).send(error(404, 'Collection not found'));
    }

    // Non-owner trying to access private collection
    if (
      !collection.isPublic &&
      collection.owner.toString() !== curUserId
    ) {
      return res.status(403).send(error(403, 'This collection is private'));
    }

    const mappedPosts = collection.posts.map((post) =>
      mapPostOutput(post, curUserId)
    );

    return res.send(
      success(200, {
        collection: {
          _id: collection._id,
          owner: collection.owner,
          name: collection.name,
          description: collection.description,
          isPublic: collection.isPublic,
          createdAt: collection.createdAt,
          posts: mappedPosts,
          postCount: mappedPosts.length,
        },
      })
    );
  } catch (err) {
    console.error('getCollectionById error:', err);
    return res.status(500).send(error(500, 'Something went wrong'));
  }
};

// PUT /collection/:id
const updateCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const curUserId = req.user.user_Id;
    const { name, description, isPublic } = req.body;

    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).send(error(404, 'Collection not found'));
    }

    if (collection.owner.toString() !== curUserId) {
      return res.status(403).send(error(403, 'Unauthorized: You do not own this collection'));
    }

    if ((name !== undefined && typeof name !== "string") || (description !== undefined && typeof description !== "string") || (isPublic !== undefined && typeof isPublic !== "boolean")) return res.status(400).json(error(400, "Invalid collection fields"));
    if (name !== undefined) collection.name = name.trim();
    if (description !== undefined) collection.description = description.trim();
    if (isPublic !== undefined) collection.isPublic = isPublic;

    await collection.save();

    // ── Cache Invalidation ──────────────────────────────────────────────────
    await invalidateCollections(curUserId);

    return res.send(success(200, { collection }));
  } catch (err) {
    console.error('updateCollection error:', err);
    return res.status(500).send(error(500, 'Something went wrong'));
  }
};

// DELETE /collection/:id
const deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const curUserId = req.user.user_Id;

    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).send(error(404, 'Collection not found'));
    }

    if (collection.owner.toString() !== curUserId) {
      return res.status(403).send(error(403, 'Unauthorized: You do not own this collection'));
    }

    await Collection.findByIdAndDelete(id);

    // ── Cache Invalidation ──────────────────────────────────────────────────
    await invalidateCollections(curUserId);

    return res.send(success(200, { message: 'Collection deleted successfully' }));
  } catch (err) {
    console.error('deleteCollection error:', err);
    return res.status(500).send(error(500, 'Something went wrong'));
  }
};

// POST /collection/:id/toggle
const togglePostInCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { postId } = req.body;
    const curUserId = req.user.user_Id;

    if (!postId) {
      return res.status(400).send(error(400, 'postId is required'));
    }

    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).send(error(404, 'Collection not found'));
    }

    if (collection.owner.toString() !== curUserId) {
      return res.status(403).send(error(403, 'Unauthorized: You do not own this collection'));
    }

    if (!await Post.exists({ _id: postId })) return res.status(404).json(error(404, "Post not found"));
    const alreadyIn = collection.posts.some(
      (p) => p.toString() === postId
    );

    if (alreadyIn) {
      collection.posts.pull(postId);
    } else {
      collection.posts.push(postId);
    }

    await collection.save();

    // ── Cache Invalidation ──────────────────────────────────────────────────
    await invalidateCollections(curUserId);

    return res.send(
      success(200, {
        isInCollection: !alreadyIn,
        postCount: collection.posts.length,
      })
    );
  } catch (err) {
    console.error('togglePostInCollection error:', err);
    return res.status(500).send(error(500, 'Something went wrong'));
  }
};

module.exports = {
  createCollection,
  getUserCollections,
  getCollectionById,
  updateCollection,
  deleteCollection,
  togglePostInCollection,
};
