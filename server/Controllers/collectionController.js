const Collection = require('../Models/collection');
const Post = require('../Models/post');
const { success, error } = require('../Utils/responseWrapper');
const { mapPostOutput } = require('../Utils/utils');

// POST /collection
const createCollection = async (req, res) => {
  try {
    const { name, description, isPublic } = req.body;
    const curUserId = req.user.user_Id;

    if (!name || !name.trim()) {
      return res.send(error(400, 'Collection name is required'));
    }

    const collection = await Collection.create({
      owner: curUserId,
      name: name.trim(),
      description: description?.trim(),
      isPublic: isPublic !== undefined ? isPublic : true,
    });

    return res.send(success(201, { collection }));
  } catch (err) {
    console.error('createCollection error:', err);
    return res.send(error(500, 'Something went wrong'));
  }
};

// GET /collection/user/:userId
const getUserCollections = async (req, res) => {
  try {
    const { userId } = req.params;
    const curUserId = req.user.user_Id;

    // Own collections → all; other user → public only
    const filter =
      userId === curUserId
        ? { owner: userId }
        : { owner: userId, isPublic: true };

    const rawCollections = await Collection.find(filter)
      .populate({
        path: 'posts',
        select: 'media',
      })
      .sort({ createdAt: -1 });

    // Attach a coverImages array (up to 4 first-media-item URLs)
    const collections = rawCollections.map((col) => {
      const colObj = col.toObject();
      colObj.coverImages = col.posts
        .slice(0, 4)
        .map((p) => p?.media?.[0]?.url)
        .filter(Boolean);
      // Replace full post objects with just post IDs for the response
      colObj.postCount = col.posts.length;
      colObj.posts = col.posts.map((p) => p._id);
      return colObj;
    });

    return res.send(success(200, { collections }));
  } catch (err) {
    console.error('getUserCollections error:', err);
    return res.send(error(500, 'Something went wrong'));
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
      return res.send(error(404, 'Collection not found'));
    }

    // Non-owner trying to access private collection
    if (
      !collection.isPublic &&
      collection.owner.toString() !== curUserId
    ) {
      return res.send(error(403, 'This collection is private'));
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
    return res.send(error(500, 'Something went wrong'));
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
      return res.send(error(404, 'Collection not found'));
    }

    if (collection.owner.toString() !== curUserId) {
      return res.send(error(403, 'Unauthorized: You do not own this collection'));
    }

    if (name !== undefined) collection.name = name.trim();
    if (description !== undefined) collection.description = description.trim();
    if (isPublic !== undefined) collection.isPublic = isPublic;

    await collection.save();

    return res.send(success(200, { collection }));
  } catch (err) {
    console.error('updateCollection error:', err);
    return res.send(error(500, 'Something went wrong'));
  }
};

// DELETE /collection/:id
const deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const curUserId = req.user.user_Id;

    const collection = await Collection.findById(id);
    if (!collection) {
      return res.send(error(404, 'Collection not found'));
    }

    if (collection.owner.toString() !== curUserId) {
      return res.send(error(403, 'Unauthorized: You do not own this collection'));
    }

    await Collection.findByIdAndDelete(id);

    return res.send(success(200, { message: 'Collection deleted successfully' }));
  } catch (err) {
    console.error('deleteCollection error:', err);
    return res.send(error(500, 'Something went wrong'));
  }
};

// POST /collection/:id/toggle
const togglePostInCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { postId } = req.body;
    const curUserId = req.user.user_Id;

    if (!postId) {
      return res.send(error(400, 'postId is required'));
    }

    const collection = await Collection.findById(id);
    if (!collection) {
      return res.send(error(404, 'Collection not found'));
    }

    if (collection.owner.toString() !== curUserId) {
      return res.send(error(403, 'Unauthorized: You do not own this collection'));
    }

    const alreadyIn = collection.posts.some(
      (p) => p.toString() === postId
    );

    if (alreadyIn) {
      collection.posts.pull(postId);
    } else {
      collection.posts.push(postId);
    }

    await collection.save();

    return res.send(
      success(200, {
        isInCollection: !alreadyIn,
        postCount: collection.posts.length,
      })
    );
  } catch (err) {
    console.error('togglePostInCollection error:', err);
    return res.send(error(500, 'Something went wrong'));
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
