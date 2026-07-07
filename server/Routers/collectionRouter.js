const router = require('express').Router();
const {
  createCollection,
  getUserCollections,
  getCollectionById,
  updateCollection,
  deleteCollection,
  togglePostInCollection,
} = require('../Controllers/collectionController');
const { verifyAuthToken } = require('../Middleware/jwtAuthMiddleware');

// Named / action routes must come before wildcard /:id routes
router.post('/', verifyAuthToken, createCollection);
router.get('/user/:userId', verifyAuthToken, getUserCollections);
router.post('/:id/toggle', verifyAuthToken, togglePostInCollection);
router.get('/:id', verifyAuthToken, getCollectionById);
router.put('/:id', verifyAuthToken, updateCollection);
router.delete('/:id', verifyAuthToken, deleteCollection);

module.exports = router;
